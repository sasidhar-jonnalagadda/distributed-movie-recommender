import { Request, Response } from "express";
import { z } from "zod";
import { mlClient, tmdbClient } from "../services";
import { asyncHandler } from "../utils/asyncHandler";
import { ValidationError } from "../errors";

// --- Validation Schemas ---

const listMoviesSchema = z.object({
  cursor: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

const movieIdSchema = z.object({
  id: z.coerce.number().int().positive("Invalid movie ID"),
});

// --- Controller Methods ---

/**
 * Lists movies with pagination and optional search.
 * Enriches results with poster URLs from TMDB.
 */
export const listMovies = asyncHandler(async (req: Request, res: Response) => {
  const result = listMoviesSchema.safeParse(req.query);
  if (!result.success) {
    throw new ValidationError(result.error.errors[0].message);
  }

  const { cursor, limit, search } = result.data;

  const mlResponse = await mlClient.getMovies(cursor, limit, search);

  // Parallel enrichment of posters
  let enrichedMovies = mlResponse.movies || [];
  if (enrichedMovies.length > 0) {
    enrichedMovies = await Promise.all(
      enrichedMovies.map(async (movie) => ({
        ...movie,
        posterUrl: await tmdbClient.getPosterUrl(movie.movie_id),
      }))
    );
  }

  res.json({
    status: "success",
    data: {
      movies: enrichedMovies,
      nextCursor: mlResponse.next_cursor, // Map snake to camel for frontend
      total_count: mlResponse.total_count,
      fallback: mlResponse.fallback,
    },
  });
});

/**
 * Retrieves detailed metadata for a single movie.
 * Merges internal ML data with external TMDB details.
 */
export const getMovie = asyncHandler(async (req: Request, res: Response) => {
  const result = movieIdSchema.safeParse(req.params);
  if (!result.success) {
    throw new ValidationError(result.error.errors[0].message);
  }

  const { id: movieId } = result.data;

  // Fetch ML metadata and TMDB details in parallel
  const [movie, tmdbDetails] = await Promise.all([
    mlClient.getMovieById(movieId),
    tmdbClient.getMovieDetails(movieId),
  ]);

  res.json({
    status: "success",
    data: {
      ...movie,
      posterUrl: tmdbClient.buildPosterUrl(tmdbDetails?.poster_path ?? null),
      backdropUrl: tmdbClient.buildPosterUrl(
        tmdbDetails?.backdrop_path ?? null,
        "w1280"
      ),
      overview: tmdbDetails?.overview ?? null,
      genres: tmdbDetails?.genres ?? [],
      releaseDate: tmdbDetails?.release_date ?? null,
      voteCount: tmdbDetails?.vote_count ?? null,
    }
  });
});
