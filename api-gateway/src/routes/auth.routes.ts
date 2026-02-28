import { Router } from "express";
import { authController } from "../controllers";
import { authenticate, authRateLimiter } from "../middleware";

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public (Rate limited)
 */
router.post("/signup", authRateLimiter, authController.signup);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get tokens
 * @access  Public (Rate limited)
 */
router.post("/login", authRateLimiter, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token cookie
 * @access  Public
 */
router.post("/refresh", authRateLimiter, authController.refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Invalidate refresh token and clear cookie
 * @access  Private
 */
router.post("/logout", authenticate, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticate, authController.getProfile);

export default router;
