import { prisma } from "@repo/db";
import { SignInSchema, SignUpSchema } from "@repo/shared";
import { compare, hash } from "bcryptjs";
import type { Request, Response } from "express";
import { JWT_SECRET } from "../config";
import { sign } from "jsonwebtoken";

const registerUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { success, data } = SignUpSchema.safeParse(req.body);

    if (!success) {
      res.status(400).json({
        message: "Invalid Inputs",
      });
      return;
    }

    const { email, password, username } = data;
    const isUsernameOrEmailAlreadyExists = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          {
            email,
          },
        ],
      },
    });

    if (isUsernameOrEmailAlreadyExists) {
      res.status(409).json({
        message: "User with this email or username already exists",
      });
      return;
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        role: "USER",
      },
    });

    res.status(201).json({
      message: "User Account Successfully Created",
      id: user.id,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const loginUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { success, data } = SignInSchema.safeParse(req.body);

    if (!success) {
      res.status(400).json({
        message: "Invalid Inputs",
      });
      return;
    }

    const { username, password } = data;
    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isValidPassword = await compare(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({
        message: "Invalid Password",
      });
      return;
    }

    const token = sign(
      {
        id: user.id,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    
    res.status(200).json({
      message: "Successful Login",
      token,
      id: user.id,
      role: user.role,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const fetchUserAuthInfoController = async (
  req: Request,
  res: Response
): Promise<void> => {
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

export {
  registerUserController,
  loginUserController,
  fetchUserAuthInfoController,
};
