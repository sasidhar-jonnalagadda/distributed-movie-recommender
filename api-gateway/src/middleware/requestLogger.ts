import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Standard HTTP Request Logger.
 * Captures request metrics (method, url, status, duration) and logs them 
 * using the centralized pino instance.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    };

    if (res.statusCode >= 500) {
      logger.error(logData, "Request failed (Server Error)");
    } else if (res.statusCode >= 400) {
      logger.warn(logData, "Request failed (Client Error)");
    } else {
      logger.info(logData, "Request completed");
    }
  });

  next();
}
