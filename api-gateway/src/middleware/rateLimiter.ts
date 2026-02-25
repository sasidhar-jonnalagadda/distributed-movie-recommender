import rateLimit from "express-rate-limit";
import { config } from "../config/env";

/**
 * Global Rate Limiter.
 * Protects the overall API surface from brute-force and DDoS attacks.
 */
export const globalRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many requests, please try again later.",
  },
});

/**
 * Auth-specific Rate Limiter.
 * Stricter limits for authentication endpoints to prevent credential stuffing.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many authentication attempts, please try again later.",
  },
});
