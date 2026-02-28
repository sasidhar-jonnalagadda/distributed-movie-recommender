import { Router } from "express";
import { watchlistController } from "../controllers";
import { authenticate } from "../middleware";

const router = Router();

// All watchlist routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/watchlist
 * @desc    Get current user's watchlist
 * @access  Private
 */
router.get("/", watchlistController.getWatchlist);

/**
 * @route   POST /api/watchlist
 * @desc    Add a movie to the watchlist
 * @access  Private
 */
router.post("/", watchlistController.addToWatchlist);

/**
 * @route   DELETE /api/watchlist/:movieId
 * @desc    Remove a movie from the watchlist
 * @access  Private
 */
router.delete("/:movieId", watchlistController.removeFromWatchlist);

export default router;
