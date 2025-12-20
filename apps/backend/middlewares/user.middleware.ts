import type { NextFunction, Request, Response } from "express";
import { verify, type JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    res.status(401).json({
      message: "Missing or Invalid Token",
    });
    return;
  }

  const token = authHeader.split(" ")[1] as string;

  try {
    const decoded = verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded || !decoded.user.id || !decoded.user.role) {
      res.status(401).json({ message: "Invalid token payload" });
      return;
    }
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};

export const requireUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    res.status(401).json({
      message: "Unauthorized",
    });
    return;
  }

  if (req.user.role !== "USER" && req.user.role !== "ADMIN") {
    res.status(403).json({
      message: "Forbidden",
    });
    return;
  }

  next();
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    res.status(401).json({
      message: "Unauthorized",
    });
    return;
  }

  if (req.user.role !== "ADMIN") {
    res.status(403).json({
      message: "Admin access required",
    });
    return;
  }

  next();
};
