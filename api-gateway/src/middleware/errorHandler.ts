import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { BaseError } from "../errors/BaseError";

/**
 * Global Error Handling Middleware.
 * Captures all unhandled errors, logs them using structured logging,
 * and sends a consistent JSON response to the client.
 */
export function errorHandler(
  err: Error | BaseError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = "Internal server error";
  let dependencyName: string | undefined;

  if (err instanceof BaseError) {
    statusCode = err.statusCode;
    message = err.message;
    dependencyName = err.dependencyName;
  }

  // Log the error
  if (dependencyName) {
    logger.error(
      { 
        dependency: dependencyName, 
        statusCode, 
        message: err.message 
      }, 
      "Downstream dependency failure"
    );
  } else if (statusCode >= 500) {
    logger.error({ err, statusCode }, "Unhandled server error");
  } else {
    logger.warn({ err, statusCode }, "Client error");
  }

  // Respond to client
  res.status(statusCode).json({
    status: "error",
    message: statusCode === 500 && process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : message,
    ...(process.env.NODE_ENV !== "production" && { 
      stack: err.stack,
      dependency: dependencyName,
      type: err.name
    }),
  });
}
