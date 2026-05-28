import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import { Server } from "http";

import { config } from "./config/env";
import { logger } from "./utils/logger";
import db from "./config/db";
import { 
  requestLogger, 
  globalRateLimiter, 
  errorHandler 
} from "./middleware";

import { asyncHandler } from "./utils/asyncHandler";
import { mlClient } from "./services";

import authRoutes from "./routes/auth.routes";
import moviesRoutes from "./routes/movies.routes";
import watchlistRoutes from "./routes/watchlist.routes";
import recommendRoutes from "./routes/recommend.routes";

const app = express();
let server: Server;

// --- Security and Pre-processing ---
app.use(helmet());

// Safely strip any accidental trailing slash from the environment variable
const liveFrontendURL = config.FRONTEND_URL?.replace(/\/$/, "");

app.use(
  cors({
    origin: [liveFrontendURL, "http://localhost:3000"], // Allow both live and local dev
    credentials: true,
  })
);

app.use(compression()); // Optimize response size
app.use(express.json());
app.use(cookieParser());

// --- Global Middleware ---
app.use(requestLogger);
app.use(globalRateLimiter);

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/movies", moviesRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/recommend", recommendRoutes);

/**
 * Enriched Health Check Endpoint.
 * Verifies connectivity to core dependencies like the Database and ML Service.
 */
app.get("/api/health", asyncHandler(async (_req, res) => {
  let dbStatus = "connected";
  try {
    await db.raw("SELECT 1");
  } catch {
    dbStatus = "disconnected";
  }

  let mlStatus = "connected";
  try {
    const mlHealth = await mlClient.getHealth();
    if (!mlHealth || mlHealth.status !== "ok") {
      mlStatus = "degraded";
    }
  } catch {
    mlStatus = "disconnected";
  }

  const isOk = dbStatus === "connected" && mlStatus === "connected";

  res.json({ 
    status: isOk ? "ok" : "degraded", 
    service: "api-gateway", 
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    dependencies: {
      database: dbStatus,
      mlService: mlStatus,
    }
  });
}));

// --- Error Handling (Must be last) ---
app.use(errorHandler);

/**
 * Starts the application with pre-flight infrastructure checks.
 * Includes retry logic to handle serverless database cold starts.
 */
async function bootstrap() {
  try {
    logger.info("🔍 Performing pre-flight infrastructure checks...");
    
    // 1. Verify Database Connectivity (With Retry Loop)
    let retries = 6; // Try up to 6 times (30 seconds total)
    
    while (retries > 0) {
      try {
        await db.raw("SELECT 1");
        logger.info("✅ Database connectivity verified.");
        break; // If successful, break out of the loop
      } catch (dbError) {
        retries -= 1;
        logger.warn(`⏳ Database waking up... Retrying connection. (${retries} attempts left)`);
        
        if (retries === 0) {
          throw new Error("Database failed to wake up after multiple attempts.", { cause: dbError });
        }
        
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } // <--- THIS WAS THE MISSING BRACE!

    // 2. Start Listening
    server = app.listen(config.PORT, () => {
      logger.info({
        port: config.PORT,
        env: config.NODE_ENV,
        mlService: config.ML_SERVICE_URL,
        frontend: config.FRONTEND_URL
      }, "🚀 API Gateway started successfully");
    });

  } catch (err) {
    logger.fatal({ err }, "❌ Failed to bootstrap API Gateway. Exiting...");
    process.exit(1);
  }
}

/**
 * Graceful Shutdown Handler.
 * Closes server and database connections cleanly.
 */
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  if (server) {
    server.close(() => {
      logger.info("HTTP server closed.");
    });
  }

  try {
    await db.destroy();
    logger.info("Database connection pool closed.");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during database pool shutdown.");
    process.exit(1);
  }
}

// Intercept termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Unhandled rejection/exception safety net
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Promise Rejection detected.");
});

bootstrap();

export default app;