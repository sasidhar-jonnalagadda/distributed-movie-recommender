import { Response } from "express";
import { z } from "zod";
import db from "../config/db";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { ValidationError, NotFoundError } from "../errors";

// --- Validation Schemas ---

const addToWatchlistSchema = z.object({
  movieId: z.coerce.number().int().positive("Invalid movie ID"),
  movieTitle: z.string().min(1, "Movie title is required"),
  posterUrl: z.string().url().optional().or(z.literal("")),
});

const movieIdParamSchema = z.object({
  movieId: z.coerce.number().int().positive("Invalid movie ID"),
});

// --- Controller Methods ---

/**
 * Retrieves the authenticated user's watchlist.
 */
export const getWatchlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const items = await db("watchlists")
    .where({ user_id: req.userId })
    .orderBy("added_at", "desc");

  res.json({
    status: "success",
    data: {
      items: items.map((item) => ({
        id: item.id,
        movieId: item.movie_id,
        movieTitle: item.movie_title,
        posterUrl: item.poster_url,
        addedAt: item.added_at,
      })),
      count: items.length,
    }
  });
});

/**
 * Adds a movie to the authenticated user's watchlist.
 */
export const addToWatchlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = addToWatchlistSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(result.error.errors[0].message);
  }

  const { movieId, movieTitle, posterUrl } = result.data;

  const [item] = await db("watchlists")
    .insert({
      user_id: req.userId,
      movie_id: movieId,
      movie_title: movieTitle,
      poster_url: posterUrl || null,
    })
    .onConflict(["user_id", "movie_id"])
    .ignore()
    .returning("*");

  if (!item) {
    const existing = await db("watchlists")
      .where({ user_id: req.userId, movie_id: movieId })
      .first();
      
    return res.status(200).json({
      status: "success",
      message: "Already in watchlist",
      data: {
        id: existing.id,
        movieId: existing.movie_id,
        movieTitle: existing.movie_title,
        posterUrl: existing.poster_url,
        addedAt: existing.added_at,
      },
    });
  }

  res.status(201).json({
    status: "success",
    message: "Added to watchlist",
    data: {
      id: item.id,
      movieId: item.movie_id,
      movieTitle: item.movie_title,
      posterUrl: item.poster_url,
      addedAt: item.added_at,
    },
  });
});

/**
 * Removes a movie from the authenticated user's watchlist.
 */
export const removeFromWatchlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = movieIdParamSchema.safeParse(req.params);
  if (!result.success) {
    throw new ValidationError(result.error.errors[0].message);
  }

  const { movieId } = result.data;

  const deleted = await db("watchlists")
    .where({ user_id: req.userId, movie_id: movieId })
    .del();

  if (deleted === 0) {
    throw new NotFoundError("Movie not found in watchlist");
  }

  res.json({ status: "success", message: "Removed from watchlist" });
});
