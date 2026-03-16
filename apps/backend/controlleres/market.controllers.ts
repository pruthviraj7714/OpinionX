import { prisma } from "@repo/db";
import { PlaceTradeSchema } from "@repo/shared";
import type { Request, Response } from "express";
import { Decimal } from "../../../packages/db/generated/prisma/internal/prismaNamespace";
import { applyTrade, getIntervalMs } from "../helper";
import type { Market } from "../../../packages/db/generated/prisma/client";
import {
  calculateBuyTrade,
  calculatePriceImpact,
  calculateSellTrade,
  MAX_PRICE_IMPACT,
  MIN_POOL,
  type TradeResult,
} from "../lib/amm";

const getMarketsController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;

    const skip = (page - 1) * limit;

    const markets = await prisma.market.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalMarkets = await prisma.market.count();

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

const getMarketByIdController = async (req: Request, res: Response) => {
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

    const liquidity = new Decimal(2).mul(
      Decimal.sqrt(market.yesPool.mul(market.noPool)),
    );

    const avgTradeSize = await prisma.trade.aggregate({
      where: { marketId, action: "BUY" },
      _avg: { amountIn: true },
      _sum: { amountIn: true },
    });

    res.status(200).json({
      ...market,
      probability: {
        yes: yesProbability.mul(100).toNumber(),
        no: noProbability.mul(100).toNumber(),
      },
      noOfTraders: tradersCount,
      liquidity,
      volume: avgTradeSize._sum.amountIn || new Decimal(0),
      averageTradeSize: avgTradeSize._avg.amountIn || new Decimal(0),
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const getMarketTradesController = async (req: Request, res: Response) => {
  try {
    const marketId = req.params.marketId;
    const limit = Number(req.query.limit) || 10;

    const rawCursor = req.query.cursor;
    const cursor =
      typeof rawCursor === "string" && rawCursor !== "undefined"
        ? rawCursor
        : undefined;

    const trades = await prisma.trade.findMany({
      where: {
        marketId,
      },
      take: limit + 1,
      orderBy: {
        createdAt: "desc",
      },
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasNextPage = trades.length > limit;
    const paginatedTrades = hasNextPage ? trades.slice(0, limit) : trades;

    res.status(200).json({
      trades: paginatedTrades || [],
      nextCursor: hasNextPage
        ? paginatedTrades[paginatedTrades.length - 1]?.id
        : null,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const getUserMarketTradesController = async (req: Request, res: Response) => {
  try {
    const marketId = req.params.marketId!;
    const userId = req.user?.id!;
    const limit = Number(req.query.limit) || 10;

    const rawCursor = req.query.cursor;
    const cursor =
      typeof rawCursor === "string" && rawCursor !== "undefined"
        ? rawCursor
        : undefined;

    const trades = await prisma.trade.findMany({
      where: {
        marketId,
        userId,
      },
      take: limit + 1,
      orderBy: {
        createdAt: "desc",
      },
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasNextPage = trades.length > limit;
    const paginatedTrades = hasNextPage ? trades.slice(0, limit) : trades;

    res.status(200).json({
      trades: paginatedTrades || [],
      nextCursor: hasNextPage
        ? paginatedTrades[paginatedTrades.length - 1]?.id
        : null,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const placeTradeController = async (req: Request, res: Response) => {
  const { success, data, error } = PlaceTradeSchema.safeParse(req.body);

  if (!success) {
    res.status(401).json({
      message: "Invalid Inputs",
      error: error.message,
    });
    return;
  }

  const { action, amount, side } = data;

  const marketId = req.params.marketId!;
  const userId = req.user?.id!;

  try {
    const { trade, market, userData } = await prisma.$transaction(
      async (tx) => {
        const [lockedMarket] = await tx.$queryRaw<
          Market[]
        >`SELECT * FROM "Market" WHERE id = ${marketId} FOR UPDATE`;

        if (!lockedMarket) {
          throw new Error("Market Not found");
        }

        if (lockedMarket.status === "CLOSED") {
          throw new Error("Market is closed");
        }

        if (Date.now() > lockedMarket.expiryTime.getTime()) {
          throw new Error("Market is closed");
        }

        const [user] = await tx.$queryRaw<
          { id: string; balance: Decimal }[]
        >`SELECT "id", "balance" FROM "User" where "id" = ${userId} FOR UPDATE`;

        if (!user) {
          throw new Error("User not found");
        }
        if (action === "BUY" && user.balance.lt(amount)) {
          throw new Error("Insufficient balance");
        }

        if (action === "SELL") {
          const [position] = await tx.$queryRaw<
            { id: string; yesShares: Decimal; noShares: Decimal }[]
          >`SELECT * FROM "Position" WHERE "userId" = ${userId} AND "marketId" = ${marketId} FOR UPDATE`;

          if (!position) {
            throw new Error("Position not found");
          }

          const sharesToSell: Decimal =
            side === "YES" ? position.yesShares : position.noShares;

          if (sharesToSell.lt(amount)) {
            throw new Error("Insufficient shares");
          }
        }

        let tradeResult: TradeResult;
        let sharesReceived: Decimal | undefined;
        let usdtReceived: Decimal | undefined;

        const totalLiquidity = lockedMarket.yesPool.plus(lockedMarket.noPool);

        if (action === "BUY" && amount.gt(totalLiquidity.mul(0.2))) {
          throw new Error("Trade exceeds max allowed size");
        }

        if (action === "SELL" && amount.gt(lockedMarket.yesPool.mul(0.2))) {
          throw new Error("Trade exceeds max allowed size");
        }

        if (action === "BUY") {
          tradeResult = calculateBuyTrade(
            side,
            amount,
            lockedMarket.yesPool,
            lockedMarket.noPool,
            lockedMarket.feePercent,
          );

          sharesReceived = tradeResult.amountOut;
        } else {
          tradeResult = calculateSellTrade(
            side,
            amount,
            lockedMarket.yesPool,
            lockedMarket.noPool,
            lockedMarket.feePercent,
          );

          usdtReceived = tradeResult.amountOut;
        }

        if (
          tradeResult.newYesPool.lte(MIN_POOL) ||
          tradeResult.newNoPool.lte(MIN_POOL)
        ) {
          throw new Error("Trade too large");
        }

        const priceImpact = calculatePriceImpact(
          lockedMarket.yesPool,
          lockedMarket.noPool,
          tradeResult.newYesPool,
          tradeResult.newNoPool,
        );

        if (priceImpact.gt(MAX_PRICE_IMPACT)) {
          throw new Error("Price Impact too high");
        }

        const position = await tx.position.upsert({
          where: {
            userId_marketId: {
              userId,
              marketId,
            },
          },
          create: {
            userId,
            marketId,
            yesShares:
              action === "BUY" && side === "YES"
                ? sharesReceived
                : new Decimal(0),
            noShares:
              action === "BUY" && side === "NO"
                ? sharesReceived
                : new Decimal(0),
          },
          update: {
            yesShares:
              side === "YES"
                ? action === "BUY"
                  ? { increment: sharesReceived }
                  : { decrement: amount }
                : undefined,

            noShares:
              side === "NO"
                ? action === "BUY"
                  ? { increment: sharesReceived }
                  : { decrement: amount }
                : undefined,
          },
        });

        const trade = await tx.trade.create({
          data: {
            amountIn: tradeResult.amountIn,
            side,
            marketId,
            action,
            userId,
            amountOut: tradeResult.amountOut,
            price: tradeResult.price,
          },
        });

        await tx.platformFee.create({
          data: {
            amount: tradeResult.fees,
            marketId,
            tradeId: trade.id,
          },
        });

        const market = await tx.market.update({
          where: {
            id: marketId,
          },
          data: {
            yesPool: tradeResult.newYesPool,
            noPool: tradeResult.newNoPool,
          },
        });

        const userData = await tx.user.update({
          where: {
            id: userId,
          },
          select: {
            balance: true,
            username: true,
            email: true,
          },
          data: {
            balance:
              action === "BUY"
                ? { decrement: amount }
                : { increment: usdtReceived },
          },
        });

        return {
          trade,
          market,
          userData,
          position,
        };
      },
    );

    res.status(200).json({
      message: "Trade executed succssfully",
      trade,
      market,
      user: userData,
    });
  } catch (error: any) {
    console.log(error);

    if (error.message.includes("Trade too large")) {
      res.status(400).json({
        message: "Trade too large",
      });
      return;
    }

    if (error.message.includes("Price Impact too high")) {
      res.status(400).json({
        message: "Price Impact too high",
      });
      return;
    }

    if (error.message.includes("Insufficient balance")) {
      res.status(400).json({
        message: "Insufficient balance",
      });
      return;
    }

    if (error.message.includes("Market is closed")) {
      res.status(423).json({
        error: "MARKET_CLOSED",
        message: "Trading is closed for this market",
      });
      return;
    }

    if (error.message.includes("Insufficient shares")) {
      res.status(400).json({
        message: "Insufficient shares",
      });
      return;
    }

    if (error.message.includes("Market not found")) {
      res.status(404).json({
        message: "Market not found",
      });
      return;
    }

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const fetchProbabilityOverTimeChartDataController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { marketId } = req.params;
    const interval = (req.query.interval as string) || "5m";
    const intervalMs = getIntervalMs(interval);

    const market = await prisma.market.findUnique({
      where: { id: marketId },
    });

    if (!market) {
      return res.status(404).json({ message: "Market not found" });
    }

    const trades = await prisma.trade.findMany({
      where: { marketId },
      orderBy: { createdAt: "asc" },
    });

    let yesPool = new Decimal(0);
    let noPool = new Decimal(0);

    const bucketMap = new Map<number, { yes: Decimal; no: Decimal }>();

    for (const trade of trades) {
      ({ yesPool, noPool } = applyTrade(trade, yesPool, noPool));

      const ts = trade.createdAt.getTime();
      const bucketStart = Math.floor(ts / intervalMs) * intervalMs;

      bucketMap.set(bucketStart, {
        yes: yesPool,
        no: noPool,
      });
    }

    const points = Array.from(bucketMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([timestamp, pools]) => {
        const total = pools.yes.plus(pools.no);
        const yesProb = total.eq(0) ? new Decimal(0.5) : pools.yes.div(total);

        return {
          timestamp: new Date(timestamp).toISOString(),
          yes: yesProb.mul(100).toNumber(),
          no: new Decimal(1).minus(yesProb).mul(100).toNumber(),
        };
      });

    res.status(200).json({ interval, points });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const fetchParticipationChartDataController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { marketId } = req.params;

    const yesTraders = await prisma.position.count({
      where: {
        marketId,
        yesShares: { gt: 0 },
      },
    });

    const noTraders = await prisma.position.count({
      where: {
        marketId,
        noShares: { gt: 0 },
      },
    });

    res.status(200).json({
      yesTraders,
      noTraders,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const checkEligibilityController = async (req: Request, res: Response) => {
  try {
    const marketId = req.params.marketId!;
    const userId = req.user?.id!;

    const market = await prisma.market.findUnique({ where: { id: marketId } });

    if (!market) {
      res.status(404).json({ message: "Market not found!" });
      return;
    }

    if (market.status !== "RESOLVED") {
      res.status(400).json({
        message: "Market is not resolved yet",
      });
      return;
    }

    const position = await prisma.position.findUnique({
      where: {
        userId_marketId: {
          userId,
          marketId,
        },
      },
    });

    if (!position) {
      res.status(200).json({
        participated: false,
        payoutStatus: "NOT_ELIGIBLE",
        payoutAmount: "0",
      });
      return;
    }

    if (position.payoutStatus === "CLAIMED") {
      res.status(200).json({
        participated: true,
        payoutStatus: "CLAIMED",
        payoutAmount: position.payoutAmount,
      });
      return;
    }

    const winningShares =
      market.resolvedOutcome === "YES"
        ? position?.yesShares
        : position?.noShares;

    if (winningShares.lte(0)) {
      res.status(200).json({
        participated: true,
        payoutStatus: "NOT_ELIGIBLE",
        payoutAmount: "0",
      });
      return;
    }

    res.status(200).json({
      participated: true,
      payoutStatus: "ELIGIBLE",
      payoutAmount: winningShares,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
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

const claimPayoutController = async (req: Request, res: Response) => {
  try {
    const marketId = req.params.marketId!;
    const userId = req.user?.id!;

    const market = await prisma.market.findUnique({ where: { id: marketId } });

    if (!market) {
      res.status(404).json({
        message: "Market not found!",
      });
      return;
    }

    if (market.status !== "RESOLVED") {
      res.status(400).json({
        message: "Market is not resolved yet",
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      const positions = await tx.$queryRawUnsafe<PositionRow[]>(
        `
        SELECT *
        FROM "Position"
        WHERE "userId" = $1
          AND "marketId" = $2
        LIMIT 1 FOR UPDATE
        `,
        userId,
        marketId,
      );

      const position = positions[0];

      if (!position) {
        throw new Error("NOT_PARTICIPATED");
      }

      if (position.payoutStatus === "CLAIMED") {
        throw new Error("ALREADY_CLAIMED");
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
  getMarketsController,
  getMarketByIdController,
  getMarketTradesController,
  getUserMarketTradesController,
  placeTradeController,
  fetchProbabilityOverTimeChartDataController,
  fetchParticipationChartDataController,
  checkEligibilityController,
  claimPayoutController,
};
