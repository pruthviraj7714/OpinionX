import { Router } from "express";
import {
  checkEligibilityController,
  claimPayoutController,
  fetchParticipationChartDataController,
  fetchProbabilityOverTimeChartDataController,
  getMarketByIdController,
  getMarketsController,
  getMarketTradesController,
  getUserMarketTradesController,
  placeTradeController,
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

marketRouter.get("/:marketId/trades", getMarketTradesController);

marketRouter.get(
  "/:marketId/trades/me",
  requireAuth,
  requireUser,
  getUserMarketTradesController
);

marketRouter.post(
  "/:marketId/trades",
  requireAuth,
  requireUser,
  placeTradeController
);

marketRouter.get(
  "/:marketId/charts/probability",
  requireAuth,
  requireUser,
  fetchProbabilityOverTimeChartDataController
);

marketRouter.get(
  "/:marketId/charts/participation",
  requireAuth,
  requireUser,
  fetchParticipationChartDataController
);

marketRouter.get(
  "/:marketId/eligibility",
  requireAuth,
  requireUser,
  checkEligibilityController
);

marketRouter.post(
  "/:marketId/claim",
  requireAuth,
  requireUser,
  claimPayoutController
);

export default marketRouter;
