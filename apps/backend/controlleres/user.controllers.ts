import { prisma } from "@repo/db";
import type { Request, Response } from "express";

const fetchUserPositionAndTradesController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const marketId = req.params.marketId;

    const [position, trades] = await Promise.all([
      prisma.position.findFirst({
        where: {
          marketId,
          userId,
        },
      }),
      prisma.trade.findMany({
        where: {
          userId,
          marketId,
        },
      }),
    ]);

    res.status(200).json({
      data: {
        position: position || {},
        trades: trades || [],
      },
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

export { fetchUserPositionAndTradesController, fetchUserProfieController };
