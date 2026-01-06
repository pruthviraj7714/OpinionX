import { Router } from "express";
import { requireAuth, requireUser } from "../middlewares/user.middleware";
import {
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

export default userRouter;
