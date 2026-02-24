import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Environment Variable Schema.
 * Validates all required configuration keys and sets sensible defaults.
 */
const envSchema = z.object({
  // Server Configuration
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Database Configuration
  DATABASE_URL: z.string().url().min(1, "DATABASE_URL is required"),

  // Security Configuration
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters in production").default("dev-secret-change-in-production-long-enough"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),

  // Service Configuration
  ML_SERVICE_URL: z.string().url().default("http://ml-service:8000"),

  // External APIs
  TMDB_API_KEY: z.string().min(1, "TMDB_API_KEY is required for movie metadata enrichment"),
  TMDB_BASE_URL: z.string().url().default("https://api.themoviedb.org/3"),
  TMDB_IMAGE_BASE: z.string().url().default("https://image.tmdb.org/t/p"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().default(100),

  // Cross-Origin Configuration
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
});

// Validate process.env
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const errors = parsedEnv.error.flatten().fieldErrors;
  console.error("❌ Invalid environment configuration:");
  Object.entries(errors).forEach(([field, messages]) => {
    console.error(`   - ${field}: ${(messages as string[])?.join(", ")}`);
  });
  process.exit(1);
}

/**
 * Validated and typed configuration object.
 */
export const config = Object.freeze(parsedEnv.data);

// Maintain backward compatibility for existing imports
export const env = config;
