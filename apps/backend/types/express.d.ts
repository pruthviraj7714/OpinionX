import express from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        role: "USER" | "ADMIN";
        id: string;
      };
    }
  }
}
