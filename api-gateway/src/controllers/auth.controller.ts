import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { z } from "zod";

import db from "../config/db";
import { config } from "../config/env";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError 
} from "../errors";

// --- Validation Schemas ---

const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// --- Controller Methods ---

/**
 * Registers a new user and returns an access token.
 */
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const result = signupSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(result.error.errors[0].message);
  }

  const { email, password, displayName } = result.data;

  const existing = await db("users").where({ email }).first();
  if (existing) {
    throw new ValidationError("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db("users")
    .insert({
      email,
      password_hash: passwordHash,
      display_name: displayName,
    })
    .returning(["id", "email", "display_name", "created_at"]);

  const { accessToken, refreshToken } = await generateTokens(user.id, user.email);

  setRefreshCookie(res, refreshToken);

  res.status(201).json({
    status: "success",
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    },
    accessToken,
  });
});

/**
 * Authenticates a user and returns an access token.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(result.error.errors[0].message);
  }

  const { email, password } = result.data;

  const user = await db("users").where({ email }).first();
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AuthenticationError("Invalid email or password");
  }

  const { accessToken, refreshToken } = await generateTokens(user.id, user.email);

  setRefreshCookie(res, refreshToken);

  res.json({
    status: "success",
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
    },
    accessToken,
  });
});

/**
 * Rotates the refresh token and issues a new access token.
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new AuthenticationError("No refresh token provided");
  }

  const tokenHash = hashToken(token);

  const stored = await db("refresh_tokens")
    .where({ token_hash: tokenHash, revoked: false })
    .where("expires_at", ">", new Date())
    .first();

  if (!stored) {
    throw new AuthenticationError("Invalid or expired refresh token");
  }

  // Revoke the old token (Refresh Token Rotation)
  await db("refresh_tokens").where({ id: stored.id }).update({ revoked: true });

  const user = await db("users").where({ id: stored.user_id }).first();
  if (!user) {
    throw new AuthenticationError("User associated with token not found");
  }

  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
    user.id,
    user.email
  );

  setRefreshCookie(res, newRefreshToken);

  res.json({ status: "success", accessToken });
});

/**
 * Revokes the current refresh token and clears the cookie.
 */
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    const tokenHash = hashToken(token);
    await db("refresh_tokens")
      .where({ token_hash: tokenHash })
      .update({ revoked: true });
  }

  res.clearCookie("refreshToken");
  res.json({ status: "success", message: "Logged out successfully" });
});

/**
 * Retrieves the profile of the currently authenticated user.
 */
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await db("users")
    .select("id", "email", "display_name", "avatar_url", "created_at")
    .where({ id: req.userId })
    .first();

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.json({
    status: "success",
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
    }
  });
});

// --- Helper Functions ---

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

async function generateTokens(userId: string, email: string) {
  const accessToken = jwt.sign({ userId, email }, config.JWT_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRY as import("jsonwebtoken").SignOptions["expiresIn"],
  });

  const refreshToken = uuidv4();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db("refresh_tokens").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return { accessToken, refreshToken };
}
