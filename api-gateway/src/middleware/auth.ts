import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { AuthenticationError } from "../errors";

/**
 * Extended Express Request to include authenticated user context.
 */
export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Authentication Middleware.
 * Validates the 'Authorization: Bearer <token>' header.
 * 
 * Throws AuthenticationError if the token is missing, malformed, or expired.
 */
export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new AuthenticationError("Missing or invalid authorization header"));
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as {
      userId: string;
      email: string;
    };
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError("Session expired, please login again"));
    }
    next(new AuthenticationError("Invalid authentication token"));
  }
}
