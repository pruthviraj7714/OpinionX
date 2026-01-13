import { prisma } from "@repo/db";
import { SignInSchema, SignUpSchema } from "@repo/shared";
import { compare, hash } from "bcryptjs";
import type { Request, Response } from "express";
import { JWT_SECRET } from "../config";
import { sign } from "jsonwebtoken";
import { Decimal } from "../../../packages/db/generated/prisma/internal/prismaNamespace";

const registerUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { success, data } = SignUpSchema.safeParse(req.body);

    if (!success) {
      res.status(400).json({
        message: "Invalid Inputs",
      });
      return;
    }

    const { email, password, username } = data;
    const isUsernameOrEmailAlreadyExists = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          {
            email,
          },
        ],
      },
    });

    if (isUsernameOrEmailAlreadyExists) {
      res.status(409).json({
        message: "User with this email or username already exists",
      });
      return;
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        role: "USER",
      },
    });

    res.status(201).json({
      message: "User Account Successfully Created",
      id: user.id,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const loginUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { success, data } = SignInSchema.safeParse(req.body);

    if (!success) {
      res.status(400).json({
        message: "Invalid Inputs",
      });
      return;
    }

    const { username, password } = data;
    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isValidPassword = await compare(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({
        message: "Invalid Password",
      });
      return;
    }

    const token = sign(
      {
        id: user.id,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Successful Login",
      token,
      id: user.id,
      role: user.role,
      username: user.username,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const calculateProbabilities = (yesPool: Decimal, noPool: Decimal) => {
  const total = yesPool.plus(noPool);
  if (total.isZero()) {
    return { yes: 50, no: 50 };
  }
  return {
    yes: yesPool.dividedBy(total).times(100).toNumber(),
    no: noPool.dividedBy(total).times(100).toNumber(),
  };
};

const calculatePayoutAmount = (
  position: any,
  market: any
): Decimal => {
  if (!market.resolvedOutcome || market.status !== "RESOLVED") {
    return new Decimal(0);
  }

  if(new Decimal(position.payoutAmount || 0).gt(0)) {
    return position.payoutAmount;
  }

  if (market.resolvedOutcome === "YES") {
    return new Decimal(position.yesShares);
  } else {
    return new Decimal(position.noShares);
  }
};

const fetchUserAccountOverviewInfoController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const [user, positions, trades] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          balance: true,
          createdAt: true,
        },
      }),
      prisma.position.findMany({
        where: { userId },
        include: {
          market: {
            select: {
              id: true,
              opinion: true,
              description: true,
              expiryTime: true,
              status: true,
              resolvedOutcome: true,
              yesPool: true,
              noPool: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      }),
      prisma.trade.findMany({
        where: { userId },
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          market: {
            select: {
              opinion: true,
            },
          },
        },
      }),
    ]);

    if (!user) {
      res.status(404).json({ message: "User not found!" });
      return;
    }

    const openPositions = positions
      .filter((pos) => pos.market.status === "OPEN")
      .map((pos) => {
        const probabilities = calculateProbabilities(
          new Decimal(pos.market.yesPool),
          new Decimal(pos.market.noPool)
        );
        return {
          id: pos.id,
          yesShares: Number(pos.yesShares),
          noShares: Number(pos.noShares),
          market: {
            id: pos.market.id,
            opinion: pos.market.opinion,
            description: pos.market.description,
            expiryTime: pos.market.expiryTime,
            status: pos.market.status,
            probability: probabilities,
          },
          estimatedValue:
            (Number(pos.yesShares) * probabilities.yes) / 100 +
            (Number(pos.noShares) * probabilities.no) / 100,
        };
      });

    const resolvedPositions = positions
      .filter((pos) => pos.market.status === "RESOLVED")
      .map((pos) => {
        const payoutAmount = calculatePayoutAmount(pos, pos.market);
        const won =
          ((pos.market.resolvedOutcome === "YES" &&
            new Decimal(pos.yesShares).greaterThan(0)) ||
          (pos.market.resolvedOutcome === "NO" &&
            new Decimal(pos.noShares).greaterThan(0))) || pos.payoutStatus === "CLAIMED";

        return {
          id: pos.id,
          yesShares: Number(pos.yesShares),
          noShares: Number(pos.noShares),
          payoutStatus: pos.payoutStatus,
          payoutAmount: Number(payoutAmount),
          claimedAt: pos.claimedAt,
          won,
          market: {
            id: pos.market.id,
            opinion: pos.market.opinion,
            description: pos.market.description,
            resolvedOutcome: pos.market.resolvedOutcome,
            updatedAt: pos.market.updatedAt,
          },
        };
      });

    const claimablePayouts = resolvedPositions
      .filter(
        (pos) =>
          pos.payoutStatus === "UNCLAIMED" &&
          pos.won &&
          pos.payoutAmount > 0
      )
      .map((pos) => ({
        id: pos.id,
        amount: pos.payoutAmount,
        market: {
          opinion: pos.market.opinion,
          resolvedOutcome: pos.market.resolvedOutcome,
        },
      }));

    const totalClaimableAmount = claimablePayouts.reduce(
      (sum, payout) => sum + payout.amount,
      0
    );

    const [tradesVolume, uniqueMarkets] = await Promise.all([
      prisma.trade.aggregate({
        where: { userId, action: "BUY" },
        _sum: { amountIn: true },
      }),
      prisma.trade.groupBy({
        by: ["marketId"],
        where: { userId },
      }),
    ]);

    const totalOpenValue = openPositions.reduce(
      (sum, pos) => sum + pos.estimatedValue,
      0
    );

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        memberSince: user.createdAt,
      },
      balance: Number(user.balance),
      positions: {
        open: openPositions,
        resolved: resolvedPositions,
      },
      payouts: {
        claimable: claimablePayouts,
        totalClaimableAmount,
      },
      activity: {
        recentTrades: trades.map((trade) => ({
          id: trade.id,
          side: trade.side,
          action: trade.action,
          amountIn: Number(trade.amountIn),
          amountOut: Number(trade.amountOut),
          price: Number(trade.price),
          createdAt: trade.createdAt,
          market: {
            opinion: trade.market.opinion,
          },
        })),
      },
      stats: {
        totalVolume: Number(tradesVolume._sum.amountIn || 0),
        totalOpenValue,
        marketsTraded: uniqueMarkets.length,
      },
    });
  } catch (error : any) {
    console.error("Error fetching user account overview:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export {
  registerUserController,
  loginUserController,
  fetchUserAccountOverviewInfoController,
};
