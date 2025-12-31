import { Router } from "express";
import {
  getMarketByIdController,
  getMarketsController,
  getMarketTrades,
} from "../controlleres/market.controllers";
import { requireAuth, requireUser } from "../middlewares/user.middleware";

const marketRouter = Router();

marketRouter.get("/", requireAuth, requireUser, getMarketsController);

marketRouter.get(
  "/:marketId",
  requireAuth,
  requireUser,
  getMarketByIdController
);

marketRouter.get(
  "/:marketId/trades",
  requireAuth,
  requireUser,
  getMarketTrades
);

export default marketRouter;
