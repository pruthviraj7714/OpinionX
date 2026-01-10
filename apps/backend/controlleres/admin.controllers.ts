import { prisma } from "@repo/db";
import { CreateMarketSchema, ResolveOutcomeSchema } from "@repo/shared";
import type { Request, Response } from "express";
import { marketQueue } from "@repo/queues";
import { DEFAULT_MARKET_FEE_PERCENT } from "../config";
import { Prisma } from "../../../packages/db/generated/prisma/client";
import { Decimal } from "../../../packages/db/generated/prisma/internal/prismaNamespace";

const createMarketController = async (req: Request, res: Response) => {
  try {
    const { success, data, error } = CreateMarketSchema.safeParse(req.body);

    if (!success) {
      res.status(400).json({
        message: "Invalid Inputs",
        error: error.message,
      });
      return;
    }

    const userId = req.user?.id!;

    const {
      description,
      expiryTime,
      opinion,
      initialLiquidity,
      feePercent: inputFeePercent,
    } = data;

    const admin = await prisma.user.findUnique({
      where: {
        id: req.user!.id,
      },
    });

    if (!admin) {
      res.status(401).json({
        message: "Admin Not found",
      });
      return;
    }

    if (admin.balance.lt(initialLiquidity)) {
      res.status(400).json({
        message: "Insufficient balance",
      });
      return;
    }

    const feePercent = inputFeePercent
      ? new Prisma.Decimal(inputFeePercent)
      : DEFAULT_MARKET_FEE_PERCENT;

    if (
      (inputFeePercent && inputFeePercent.lessThan(0)) ||
      inputFeePercent?.greaterThan(5)
    ) {
      res.status(400).json({
        message: "Fee Percent Must be between 0% and 5%",
      });
      return;
    }

    const yesPool = initialLiquidity.mul(50).div(100);
    const noPool = initialLiquidity.mul(50).div(100);

    const market = await prisma.$transaction(async (tx) => {
      const market = await tx.market.create({
        data: {
          description,
          expiryTime: new Date(expiryTime),
          opinion,
          userId,
          yesPool,
          feePercent,
          noPool,
        },
      });

      await tx.user.update({
        where: {
          id: req.user!.id,
        },
        data: {
          balance: {
            decrement: initialLiquidity,
          },
        },
      });

      return market;
    });

    const delay = new Date(expiryTime).getTime() - Date.now();

    if (delay <= 0) {
      return res.status(400).json({
        message: "Expiry time must be in the future",
      });
    }

    await marketQueue.add(
      "close-market-on-expiry",
      {
        marketId: market.id,
      },
      {
        delay,
        jobId: market.id,
      }
    );

    res.status(201).json({
      message: "Market Successfully Created",
      id: market.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const fetchAdminMarketsController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;

    const skip = (page - 1) * limit;

    const markets = await prisma.market.findMany({
      where: {
        userId,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "asc",
      },
    });

    const totalMarkets = await prisma.market.count({
      where: { userId: userId },
    });

    res.status(200).json({
      page,
      limit,
      markets,
      totalMarkets,
      totalPages: Math.ceil(totalMarkets / limit),
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const fetchMarketPositionsAndTradesController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id!;
    const marketId = req.params.marketId!;

    const market = await prisma.market.findFirst({
      where: {
        id: marketId,
        userId,
      },
    });

    if (!market) {
      res.status(400).json({
        message: "Market is accessed by only respective admin",
      });
      return;
    }

    const [positions, trades] = await Promise.all([
      prisma.position.findMany({
        where: {
          marketId,
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      }),

      prisma.trade.findMany({
        where: {
          marketId,
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      data: {
        positions: positions || [],
        trades: trades || [],
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const fetchMarketByIdController = async (req: Request, res: Response) => {
  try {
    const marketId = req.params.marketId;

    const [market, tradersCount] = await Promise.all([
      await prisma.market.findFirst({
        where: {
          id: marketId,
        },
      }),
      await prisma.position.count({ where: { marketId } }),
    ]);

    if (!market) {
      res.status(404).json({
        message: "Market not found!",
      });
      return;
    }

    const totalPool = market.yesPool.plus(market.noPool);

    const yesProbability = totalPool.eq(0)
      ? new Decimal(0.5)
      : market.yesPool.div(totalPool);

    const noProbability = new Decimal(1).minus(yesProbability);

    res.status(200).json({
      ...market,
      probability: {
        yes: yesProbability.mul(100).toNumber(),
        no: noProbability.mul(100).toNumber(),
      },
      noOfTraders: tradersCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const resolveOutcomeController = async (req: Request, res: Response) => {
  try {
    const { success, error, data } = ResolveOutcomeSchema.safeParse(req.body);
    if (!success) {
      res.status(400).json({
        message: "Invalid Inputs",
        error: error.message,
      });
      return;
    }

    const userId = req.user?.id!;

    const marketId = req.params.marketId!;

    const market = await prisma.market.findFirst({
      where: {
        id: marketId,
        userId,
      },
    });

    if (!market) {
      res.status(400).json({
        message: "Market not found or you don't have access!",
      });
      return;
    }

    if (market.status === "OPEN") {
      res.status(409).json({
        message: "Market is still open",
      });
      return;
    }

    if (market.status === "RESOLVED") {
      res.status(409).json({
        message: "Market is already resolved",
      });
      return;
    }

    const { outcome } = data;

    await prisma.market.update({
      where: {
        id: marketId,
      },
      data: {
        status: "RESOLVED",
        resolvedOutcome: outcome,
      },
    });

    res.status(200).json({
      message: "Market resolved successfully",
      marketId: market.id,
      resolvedOutcome: outcome,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const getMarketFeesStatsController = async (req: Request, res: Response) => {
  try {
    const marketId = req.params.marketId!;

    const fees = await prisma.platformFee.aggregate({
      where: { marketId },
      _sum: { amount: true },
      _count: { _all: true },
    });

    res.status(200).json({
      marketId: marketId,
      totalFees: fees._sum.amount?.toString() ?? "0.00",
      tradeCount: fees._count._all,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export {
  createMarketController,
  fetchAdminMarketsController,
  fetchMarketByIdController,
  fetchMarketPositionsAndTradesController,
  resolveOutcomeController,
  getMarketFeesStatsController,
};
