import { Router } from "express";
import { requireAdmin, requireAuth } from "../middlewares/user.middleware";
import {
  createMarketController,
  fetchAdminMarketsController,
  fetchMarketByIdController,
  fetchMarketPositionsAndTradesController,
  resolveOutcomeController,
} from "../controlleres/admin.controllers";

const adminRouter = Router();

adminRouter.post("/markets", requireAuth, requireAdmin, createMarketController);

adminRouter.get(
  "/markets",
  requireAuth,
  requireAdmin,
  fetchAdminMarketsController
);

adminRouter.get(
  "/markets/:marketId",
  requireAuth,
  requireAdmin,
  fetchMarketByIdController
);

adminRouter.get(
  "/markets/:marketId/positions-and-trades",
  requireAuth,
  requireAdmin,
  fetchMarketPositionsAndTradesController
);

adminRouter.post(
  "/markets/:marketId/resolve",
  requireAuth,
  requireAdmin,
  resolveOutcomeController
);

export default adminRouter;
