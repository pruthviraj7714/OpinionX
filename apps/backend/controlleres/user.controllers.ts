import { prisma } from "@repo/db";
import type Decimal from "decimal.js";
import type { Request, Response } from "express";

const fetchUserPositionController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const marketId = req.params.marketId;

    const position = await prisma.position.findFirst({
      where: {
        marketId,
        userId,
      },
    });

    res.status(200).json({
      position: position || {},
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const fetchUserProfieController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        balance: true,
        createdAt: true,
        email: true,
        username: true,
        updatedAt: true,
      },
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const fetchUserBalanceController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      res.status(400).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      balance: user.balance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

type PositionRow = {
  id: string;
  userId: string;
  createdAt: Date;
  marketId: string;
  noShares: Decimal;
  updatedAt: Date;
  yesShares: Decimal;
  payoutStatus: "CLAIMED" | null | "UNCLAIMED";
  claimedAt: null | Date;
  payoutAmount: Decimal;
};

const claimPayoutByIdController = async (req: Request, res: Response) => {
  const positionId = req.query.payoutId as string;
  const userId = req.user?.id!;

  try {
    await prisma.$transaction(async (tx) => {
      const positions = await tx.$queryRawUnsafe<PositionRow[]>(
        `
            SELECT *
            FROM "Position"
            WHERE "userId" = $1
              AND "id" = $2
            LIMIT 1 FOR UPDATE
            `,
        userId,
        positionId
      );

      const position = positions[0];

      if (!position) {
        throw new Error("NOT_PARTICIPATED");
      }

      if (position.payoutStatus === "CLAIMED") {
        throw new Error("ALREADY_CLAIMED");
      }

      const market = await prisma.market.findFirst({
        where: {
          id: position.marketId,
        },
      });

      if (!market) {
        throw new Error("MARKET_NOT_FOUND");
      }

      const payoutAmount =
        market.resolvedOutcome === "YES"
          ? position.yesShares
          : position.noShares;

      if (payoutAmount.lte(0)) {
        throw new Error("NOT_ELIGIBLE");
      }

      await tx.position.update({
        where: {
          id: position.id,
        },
        data: {
          claimedAt: new Date(),
          payoutAmount,
          payoutStatus: "CLAIMED",
        },
      });
      await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          balance: {
            increment: payoutAmount,
          },
        },
      });
    });

    res.status(200).json({
      message: "Payout Successfully Claimed",
    });
  } catch (error: any) {
    if (error.message === "ALREADY_CLAIMED") {
      return res.status(200).json({
        message: "Payout already claimed",
        payoutStatus: "CLAIMED",
      });
    }

    if (error.message === "MARKET_NOT_FOUND") {
      return res.status(400).json({
        message: "Market not found!",
      });
    }

    if (error.message === "NOT_ELIGIBLE") {
      return res.status(400).json({
        message: "Not eligible for payout",
      });
    }

    if (error.message === "NOT_PARTICIPATED") {
      return res.status(400).json({
        message: "You did not participate in this market",
      });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  fetchUserPositionController,
  fetchUserProfieController,
  fetchUserBalanceController,
  claimPayoutByIdController,
};
