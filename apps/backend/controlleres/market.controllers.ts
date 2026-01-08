import { prisma } from "@repo/db";
import { PlaceTradeSchema } from "@repo/shared";
import type { Request, Response } from "express";
import { Decimal } from "../../../packages/db/generated/prisma/internal/prismaNamespace";
import { applyTrade, getIntervalMs } from "../helper";

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

const getMarketTradesController = async (req: Request, res: Response) => {
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
      trades: trades || [],
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

    const trades = await prisma.trade.findMany({
      where: {
        marketId,
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      trades: trades || [],
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const calculateFinalAmount = (amount: Decimal, feePercent: Decimal) => {
  const fees = amount.mul(feePercent).div(100);
  return {
    finalAmount: amount.minus(fees),
    fees,
  };
};

const calculateFinalAmountForSell = (amount: Decimal, feePercent: Decimal) => {
  const fees = amount.mul(feePercent).div(100);
  return {
    finalAmountAfterFees: amount.minus(fees),
    fees,
  };
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
    const market = await prisma.market.findUnique({
      where: {
        id: marketId,
      },
    });

    if (!market) {
      res.status(404).json({
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
      let finalAmountAfter;
      let feesForSell;
      const { finalAmount, fees } = calculateFinalAmount(
        amount,
        market.feePercent
      );

      if (action === "BUY") {
        if (side === "YES") {
          newNoPool = market.noPool.plus(finalAmount);
          newYesPool = k.div(newNoPool);
          delta = new Decimal(market.yesPool).minus(newYesPool);

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
              noShares: new Decimal(0),
            },
            update: {
              yesShares: {
                increment: delta,
              },
            },
          });
        } else {
          newYesPool = market.yesPool.plus(finalAmount);
          newNoPool = k.div(newYesPool);
          delta = new Decimal(market.noPool).minus(newNoPool);
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
              yesShares: new Decimal(0),
              noShares: delta,
            },
            update: {
              noShares: {
                increment: delta,
              },
            },
          });
        }

        await tx.platformFee.create({
          data: {
            amount: fees,
            marketId,
          },
        });

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
      } else {
        if (side === "YES") {
          newYesPool = market.yesPool.plus(amount);
          newNoPool = k.div(newYesPool);
          delta = market.noPool.minus(newNoPool);

          const { finalAmountAfterFees, fees } = calculateFinalAmountForSell(
            delta,
            market.feePercent
          );
          finalAmountAfter = finalAmountAfterFees;
          feesForSell = fees;
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
              yesShares: new Decimal(0),
              noShares: new Decimal(0),
            },
            update: {
              yesShares: {
                decrement: amount,
              },
            },
          });
          await tx.platformFee.create({
            data: {
              amount: feesForSell,
              marketId,
            },
          });
        } else {
          newNoPool = market.noPool.plus(amount);
          newYesPool = k.div(newNoPool);
          delta = market.yesPool.minus(newYesPool);

          const { finalAmountAfterFees, fees } = calculateFinalAmountForSell(
            delta,
            market.feePercent
          );
          finalAmountAfter = finalAmountAfterFees;
          feesForSell = fees;
          await tx.platformFee.create({
            data: {
              amount: feesForSell,
              marketId,
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
              yesShares: new Decimal(0),
              noShares: new Decimal(0),
            },
            update: {
              noShares: {
                decrement: amount,
              },
            },
          });
        }

        await tx.user.update({
          where: {
            id: userId,
          },
          data: {
            balance: {
              increment: finalAmountAfter,
            },
          },
        });
      }

      const trade = await tx.trade.create({
        data: {
          amountIn: action === "BUY" ? finalAmount : amount,
          side,
          marketId,
          action,
          userId,
          amountOut: action === "BUY" ? delta : finalAmountAfter!,
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

      const userData = await tx.user.findFirst({
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

const fetchProbabilityOverTimeChartDataController = async (
  req: Request,
  res: Response
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
  res: Response
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

    if (position.payoutStatus === "CLAIMED") {
      res.status(200).json({
        participated: true,
        payoutStatus: "CLAIMED",
        payoutAmount: position.payoutAmount,
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
        marketId
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
