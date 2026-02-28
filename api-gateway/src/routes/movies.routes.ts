import { Router } from "express";
import { moviesController } from "../controllers";

const router = Router();

/**
 * @route   GET /api/movies
 * @desc    Get paginated list of movies with optional search
 * @access  Public
 */
router.get("/", moviesController.listMovies);

/**
 * @route   GET /api/movies/:id
 * @desc    Get detailed metadata for a specific movie
 * @access  Public
 */
router.get("/:id", moviesController.getMovie);

export default router;
