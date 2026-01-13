import { Router } from "express";
import { requireAuth, requireUser } from "../middlewares/user.middleware";
import {
  claimPayoutByIdController,
  fetchUserBalanceController,
  fetchUserPositionController,
  fetchUserProfieController,
} from "../controlleres/user.controllers";

const userRouter = Router();

userRouter.get("/me", requireAuth, requireUser, fetchUserProfieController);

userRouter.get(
  "/:marketId/position",
  requireAuth,
  requireUser,
  fetchUserPositionController
);

userRouter.get(
  "/balance",
  requireAuth,
  requireUser,
  fetchUserBalanceController
);

userRouter.post(
  "/claim-payout",
  requireAuth,
  requireUser,
  claimPayoutByIdController
);

export default userRouter;
