import { Request, Response } from "express";
import { z } from "zod";
import { mlClient, tmdbClient } from "../services";
import { asyncHandler } from "../utils/asyncHandler";
import { ValidationError } from "../errors";

// --- Validation Schemas ---

const recommendParamsSchema = z.object({
  movieId: z.coerce.number().int().positive("Invalid movie ID"),
});

const recommendQuerySchema = z.object({
  num: z.coerce.number().int().min(1).max(50).default(10),
  min_similarity: z.coerce.number().min(0).max(1).default(0.2),
});

// --- Controller Methods ---

/**
 * Retrieves movie recommendations based on a source movie ID.
 * Performs enrichment with TMDB poster data and handles service fallbacks.
 */
export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
  // 1. Rigorous Input Validation
  const paramsResult = recommendParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    throw new ValidationError(paramsResult.error.errors[0].message);
  }

  const queryResult = recommendQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    throw new ValidationError(queryResult.error.errors[0].message);
  }

  const { movieId } = paramsResult.data;
  const { num, min_similarity: minSimilarity } = queryResult.data;

  // 2. Fetch recommendations from ML service
  const data = await mlClient.getRecommendations(movieId, num, minSimilarity);

  // 3. Handle Fallback State (Circuit Breaker is OPEN)
  if (data.fallback) {
    return res.json({
      status: "success",
      data: {
        ...data,
        message: "ML Service is currently offline. Showing an empty selection for stability.",
        warning: "Personalized recommendations are temporarily unavailable.",
      }
    });
  }

  // 4. Graceful TMDB Enrichment
  if (data.recommendations && data.recommendations.length > 0) {
    data.recommendations = await Promise.all(
      data.recommendations.map(async (rec) => {
        try {
          const posterUrl = await tmdbClient.getPosterUrl(rec.movie_id);
          return { ...rec, posterUrl };
        } catch {
          // Log enrichment failure but don't fail the whole request
          return { ...rec, posterUrl: undefined };
        }
      })
    );
  }

  res.json({
    status: "success",
    data
  });
});
