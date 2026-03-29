import { z } from "zod";

/** Stock symbol: 1-5 uppercase alpha characters */
export const symbolSchema = z
  .string()
  .min(1, "Symbol is required")
  .max(5, "Symbol must be 1-5 characters")
  .regex(/^[A-Za-z]{1,5}$/, "Invalid stock symbol")
  .transform((s) => s.toUpperCase());

/** Watchlist POST */
export const watchlistSchema = z.object({
  symbol: symbolSchema,
  convictionLevel: z.coerce.number().int().min(1).max(5).default(3),
  notes: z.string().max(1000, "Notes must be under 1000 characters").default(""),
});

/** Journal POST */
export const journalSchema = z.object({
  symbol: symbolSchema,
  thesis: z.string().max(2000, "Thesis must be under 2000 characters").default(""),
  risks: z.string().max(2000, "Risks must be under 2000 characters").default(""),
  expectedUpside: z.string().max(200).default(""),
  reviewDate: z.string().optional(),
});

/** Profile POST */
export const profileSchema = z.object({
  displayName: z.string().max(100, "Display name must be under 100 characters").default(""),
  bio: z.string().max(500, "Bio must be under 500 characters").default(""),
});

/** Allocation targets POST */
export const allocationTargetSchema = z.object({
  targets: z.array(
    z.object({
      sector: z.string().min(1).max(100),
      targetPercent: z.number().min(0).max(100),
    })
  ).max(20, "Maximum 20 sectors"),
});

/** Price alerts POST */
export const alertSchema = z.object({
  symbol: symbolSchema,
  targetPrice: z.number().positive("Price must be positive").max(10_000_000),
  direction: z.enum(["above", "below"]),
});

/** Correlation GET */
export const correlationSymbolsSchema = z
  .string()
  .min(1)
  .transform((s) => s.split(",").map((v) => v.trim().toUpperCase()).filter(Boolean))
  .refine((arr) => arr.length >= 2, "Need at least 2 symbols")
  .refine((arr) => arr.length <= 10, "Maximum 10 symbols")
  .refine((arr) => arr.every((s) => /^[A-Z]{1,5}$/.test(s)), "Invalid symbol format");

/** Auth schemas */
export const loginSchema = z.object({
  email: z.string().email("Invalid email").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  displayName: z.string().max(100).optional(),
});
