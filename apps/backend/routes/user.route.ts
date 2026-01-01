import { Router } from "express";
import { requireAuth, requireUser } from "../middlewares/user.middleware";
import {
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

export default userRouter;
