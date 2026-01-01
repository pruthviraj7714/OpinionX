import { prisma } from "@repo/db";
import { PlaceTradeSchema } from "@repo/shared";
import type { Request, Response } from "express";
import { Decimal } from "../../../packages/db/generated/prisma/internal/prismaNamespace";

const getMarketsController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const markets = await prisma.market.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "asc",
      },
    });

    const totalMarkets = await prisma.market.count();

    res.status(200).json({
      page,
      limit,
      markets,
      totalMarkets,
      totalPages: Math.floor(totalMarkets / limit),
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

    const market = await prisma.market.findFirst({
      where: {
        id: marketId,
      },
    });

    if (!market) {
      res.status(400).json({
        message: "Market not found!",
      });
      return;
    }

    res.status(200).json({
      data: market,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const getMarketTrades = async (req: Request, res: Response) => {
  try {
    const marketId = req.params.marketId;

    const trades = await prisma.trade.findMany({
      where: {
        marketId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      data: trades || [],
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
    const market = await prisma.market.findFirst({
      where: {
        id: marketId,
      },
    });

    if (!market) {
      res.status(400).json({
        message: "Market not found",
      });
      return;
    }

    if (market.status === "CLOSED") {
      res.status(423).json({
        error: "MARKET_CLOSED",
        message: "Trading is closed for this market",
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (action === "BUY" && user?.balance.lt(amount)) {
      res.status(400).json({
        error: "INSUFFICIENT_BALANCE",
        message: "Not enough balance to execute trade",
      });
      return;
    }

    if (action === "SELL") {
      const position = await prisma.position.findFirst({
        where: {
          userId,
          marketId,
        },
      });

      if (!position) {
        res.status(400).json({
          error: "POSITION_NOT_FOUND",
          message: "Position not found",
        });
        return;
      }

      const sharesToSell: Decimal =
        side === "YES" ? position.yesShares : position.noShares;

      if (sharesToSell.lt(amount)) {
        res.status(400).json({
          error: "INSUFFICIENT_SHARES",
          message: "You do not own enough shares to sell",
        });
        return;
      }
    }

    const { trade, mkt, userData } = await prisma.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(
        `SELECT * FROM "Market" WHERE id = $1 FOR UPDATE`,
        marketId
      );

      const k = market.yesPool.mul(market.noPool);

      let newYesPool;
      let newNoPool;
      let delta;
      if (action === "BUY") {
        if (side === "YES") {
          newYesPool = market.yesPool.plus(amount);
          newNoPool = k.div(newYesPool);
          delta = new Decimal(market.noPool).minus(newNoPool);
        } else {
          newNoPool = market.noPool.plus(amount);
          newYesPool = k.div(newNoPool);
          delta = new Decimal(market.yesPool).minus(newYesPool);
        }

        await tx.user.update({
          where: {
            id: userId,
          },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });

        await tx.position.upsert({
          where: {
            userId_marketId: {
              userId,
              marketId,
            },
          },
          create: {
            userId,
            marketId,
            yesShares: side === "YES" ? delta : new Decimal(0),
            noShares: side === "NO" ? delta : new Decimal(0),
          },
          update: {
            yesShares: {
              increment: delta,
            },
            noShares: {
              increment: delta,
            },
          },
        });
      } else {
        if (side === "YES") {
          newYesPool = market.yesPool.minus(amount);
          newNoPool = k.div(newYesPool);
          delta = newNoPool.minus(market.noPool);
        } else {
          newNoPool = market.noPool.minus(amount);
          newYesPool = k.div(newNoPool);
          delta = newYesPool.minus(market.yesPool);
        }

        await tx.position.upsert({
          where: {
            userId_marketId: {
              userId,
              marketId,
            },
          },
          create: {
            userId,
            marketId,
            yesShares: side === "YES" ? delta : new Decimal(0),
            noShares: side === "NO" ? delta : new Decimal(0),
          },
          update: {
            yesShares: {
              decrement: delta,
            },
            noShares: {
              decrement: delta,
            },
          },
        });

        await tx.user.update({
          where: {
            id: userId,
          },
          data: {
            balance: {
              increment: delta,
            },
          },
        });
      }

      const trade = await tx.trade.create({
        data: {
          amountIn: amount,
          side,
          marketId,
          userId,
          amountOut: delta,
          price: amount.div(delta),
        },
      });

      const mkt = await tx.market.update({
        where: {
          id: marketId,
        },
        data: {
          yesPool: newYesPool,
          noPool: newNoPool,
        },
      });

      const userData = await prisma.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          balance: true,
          username: true,
          email: true,
        },
      });

      return {
        trade,
        mkt,
        userData,
      };
    });

    res.status(200).json({
      message: "Trade executed succssfully",
      trade,
      market: mkt,
      user: userData,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export {
  getMarketsController,
  getMarketByIdController,
  getMarketTrades,
  placeTradeController,
};
