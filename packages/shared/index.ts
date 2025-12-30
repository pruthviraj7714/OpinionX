import { z } from "zod";
import { Decimal } from "decimal.js";

export const SignUpSchema = z.object({
  username: z
    .string()
    .min(6, { error: "Username Should be at least of 6 characters" }),
  password: z
    .string()
    .min(8, { error: "Password Should be at least of 8 characters" }),
  email: z.email({ error: "Email should be valid" }),
});

export const SignInSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const CreateMarketSchema = z.object({
  opinion: z
    .string()
    .min(6, { error: "Opinion should be at least of 6 characters" }),
  description: z
    .string()
    .min(5, { error: "Description should be at least of 15 characters" }),
  expiryTime: z.coerce.date({
    error: "It should be valid Date",
  }),
  initialLiquidity: z
    .instanceof(Decimal)
    .or(z.string().transform((v) => new Decimal(v)))
    .refine((v) => v.dp() <= 2, "Too many decimal places"),
    feePercent : z
  .instanceof(Decimal)
  .or(z.string().transform((v) => new Decimal(v)))
  .refine((v) => v.dp() <= 2, "Too many decimal places").optional()
});
