import { config } from "../config/env";
import { logger } from "../utils/logger";
import db from "../config/db";
import { createCircuitBreaker } from "./circuitBreaker";
import { BaseClient } from "./BaseClient";

const PLACEHOLDER_POSTER = "/no-poster.png";

export interface TMDBMovieDetails {
  id: number;
  title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
}

/**
 * Internal TMDB Client implementation.
 */
class TMDBClient extends BaseClient {
  constructor() {
    const isV4Token = config.TMDB_API_KEY.length > 32;
    super("TMDB Service", {
      baseURL: config.TMDB_BASE_URL,
      timeout: 3000,
      headers: isV4Token ? { Authorization: `Bearer ${config.TMDB_API_KEY}` } : {},
      params: {
        ...(!isV4Token && { api_key: config.TMDB_API_KEY }),
        language: "en-US",
      },
    });
  }

  /**
   * Directly fetches details from TMDB API.
   */
  async fetchFromApi(tmdbId: number): Promise<TMDBMovieDetails> {
    const { data } = await this.axiosInstance.get<TMDBMovieDetails>(`/movie/${tmdbId}`);
    return data;
  }
}

const client = new TMDBClient();

// Circuit Breaker for TMDB API calls
const tmdbBreaker = createCircuitBreaker(client.fetchFromApi.bind(client), {
  name: "tmdb-api",
});

/**
 * Fetches movie details with an integrated database cache (Smart Cache).
 */
export async function getMovieDetails(
  tmdbId: number
): Promise<TMDBMovieDetails | null> {
  try {
    // 1. Try local cache first
    const cached = await db("movie_metadata")
      .where({ movie_id: tmdbId })
      .first();

    if (cached) {
      logger.debug({ tmdbId }, "🎯 [SMART CACHE] Hit — Serving from Database");
      return {
        id: cached.movie_id,
        overview: cached.overview,
        poster_path: cached.poster_path,
        backdrop_path: cached.backdrop_path,
        release_date: cached.release_date,
        vote_average: Number(cached.vote_average),
        vote_count: cached.vote_count,
        genres: typeof cached.genres === "string" ? JSON.parse(cached.genres) : cached.genres,
      };
    }

    logger.info({ tmdbId }, "🌀 [SMART CACHE] Miss — Fetching from TMDB API");

    // 2. Fetch from TMDB if not in cache (protected by circuit breaker)
    const data = await tmdbBreaker.fire(tmdbId);

    // 3. Update cache (upsert)
    await db("movie_metadata")
      .insert({
        movie_id: data.id,
        poster_path: data.poster_path,
        backdrop_path: data.backdrop_path,
        overview: data.overview,
        genres: JSON.stringify(data.genres),
        release_date: data.release_date,
        vote_average: data.vote_average,
        vote_count: data.vote_count,
      })
      .onConflict("movie_id")
      .merge();

    return data;
  } catch (err) {
    logger.warn({ tmdbId, err }, "Failed to fetch/cache TMDB movie details");
    return null;
  }
}

/**
 * Helper to construct a full poster URL.
 */
export function buildPosterUrl(
  posterPath: string | null,
  size: string = "w500"
): string {
  if (!posterPath || posterPath === "") return PLACEHOLDER_POSTER;
  return `${config.TMDB_IMAGE_BASE}/${size}${posterPath}`;
}

/**
 * Convenience method to get just the poster URL for a movie.
 */
export async function getPosterUrl(tmdbId: number): Promise<string> {
  const details = await getMovieDetails(tmdbId);
  return buildPosterUrl(details?.poster_path ?? null);
}

export const tmdbClient = {
  getMovieDetails,
  buildPosterUrl,
  getPosterUrl,
};
