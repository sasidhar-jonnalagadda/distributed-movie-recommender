import { Router } from "express";
import { recommendController } from "../controllers";

const router = Router();

/**
 * @route   GET /api/recommend/:movieId
 * @desc    Get movie recommendations based on a source movie
 * @access  Public
 */
router.get("/:movieId", recommendController.getRecommendations);

export default router;
