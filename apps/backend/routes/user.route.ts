import { Router } from "express";
import { requireAuth, requireUser } from "../middlewares/user.middleware";
import {
  fetchUserBalanceController,
  fetchUserPositionAndTradesController,
  fetchUserProfieController,
} from "../controlleres/user.controllers";

const userRouter = Router();

userRouter.get("/me", requireAuth, requireUser, fetchUserProfieController);

userRouter.get(
  "/:marketId/position-and-trades",
  requireAuth,
  requireUser,
  fetchUserPositionAndTradesController
);

userRouter.get(
  "/balance",
  requireAuth,
  requireUser,
  fetchUserBalanceController
);

//TODO:POST /api/markets/:marketId/claim

export default userRouter;
