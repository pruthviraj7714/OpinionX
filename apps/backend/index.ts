import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.route";
import userRouter from "./routes/user.route";
import marketRouter from "./routes/market.route";
import adminRouter from "./routes/admin.route";
import { PORT } from "./config";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    message: "Healthy Server",
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/markets", marketRouter);
app.use("/api/v1/admin", adminRouter);

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
