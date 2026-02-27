import { config } from "../config/env";
import { createCircuitBreaker } from "./circuitBreaker";
import { BaseClient } from "./BaseClient";

/**
 * Interface representing a single recommendation from the ML Service.
 */
export interface MLRecommendation {
  movie_id: number;
  title: string;
  year: number | null;
  vote_average: number | null;
  similarity_score: number;
  posterUrl?: string; // Enriched later
}

/**
 * Interface representing the full response from the ML Service recommendation endpoint.
 */
export interface MLRecommendationResponse {
  source_movie_id: number;
  recommendations: MLRecommendation[];
  count: number;
  fallback?: boolean;
}

/**
 * Interface for paginated movie listing from the ML Service.
 */
export interface MLMovieMetadata {
  movie_id: number;
  title: string;
  year: number | null;
  vote_average: number | null;
}

export interface MLMoviesResponse {
  movies: MLMovieMetadata[];
  next_cursor: number | null;
  total_count: number;
  fallback?: boolean;
}

export interface MLHealthResponse {
  status: string;
  version: string;
  model_ready: boolean;
  total_movies: number;
}

/**
 * Client for interfacing with the Machine Learning microservice.
 * Implements fault tolerance via retries and circuit breakers.
 */
class MLClient extends BaseClient {
  constructor() {
    super("ML Service", {
      baseURL: config.ML_SERVICE_URL,
      timeout: 5000,
    });
  }

  /**
   * Fetches movie recommendations.
   */
  async getRecommendations(
    movieId: number,
    num: number = 10,
    minSimilarity: number = 0.2
  ): Promise<MLRecommendationResponse> {
    return this.withRetry(async () => {
      const { data } = await this.axiosInstance.get<MLRecommendationResponse>(
        `/recommend/${movieId}`,
        { params: { num, min_similarity: minSimilarity } }
      );
      return data;
    });
  }

  /**
   * Fetches a paginated list of movies.
   */
  async getMovies(
    cursor?: number | null,
    limit: number = 20,
    search?: string
  ): Promise<MLMoviesResponse> {
    return this.withRetry(async () => {
      const { data } = await this.axiosInstance.get<MLMoviesResponse>("/movies", {
        params: { cursor, limit, search },
      });
      return data;
    });
  }

  /**
   * Fetches metadata for a specific movie.
   */
  async getMovieById(movieId: number): Promise<MLMovieMetadata> {
    return this.withRetry(async () => {
      const { data } = await this.axiosInstance.get<MLMovieMetadata>(`/movies/${movieId}`);
      return data;
    });
  }

  /**
   * Performs a health check.
   */
  async getHealth(): Promise<MLHealthResponse> {
    const { data } = await this.axiosInstance.get<MLHealthResponse>("/health");
    return data;
  }
}

// Instance for circuit breaker wrapping
const client = new MLClient();

// Circuit Breakers
const recommendBreaker = createCircuitBreaker<MLRecommendationResponse, [number, number?, number?]>(
  client.getRecommendations.bind(client),
  {
    name: "ml-recommend",
    fallback: (movieId: number) => ({
      source_movie_id: movieId,
      recommendations: [],
      count: 0,
      fallback: true,
    }),
  }
);

const moviesBreaker = createCircuitBreaker<MLMoviesResponse, [number?, number?, string?]>(
  client.getMovies.bind(client), 
  {
    name: "ml-movies",
    fallback: () => ({
      movies: [],
      next_cursor: null,
      total_count: 0,
      fallback: true,
    }),
  }
);

const movieByIdBreaker = createCircuitBreaker<MLMovieMetadata, [number]>(
  client.getMovieById.bind(client), 
  {
    name: "ml-movie-detail",
  }
);

const healthBreaker = createCircuitBreaker<MLHealthResponse, []>(
  client.getHealth.bind(client), 
  {
    name: "ml-health",
  }
);

/**
 * Exported production-ready ML client.
 */
export const mlClient = {
  getRecommendations: (movieId: number, num?: number, minSimilarity?: number) =>
    recommendBreaker.fire(movieId, num, minSimilarity),

  getMovies: (cursor?: number, limit?: number, search?: string) =>
    moviesBreaker.fire(cursor, limit, search),

  getMovieById: (movieId: number) => movieByIdBreaker.fire(movieId),

  getHealth: () => healthBreaker.fire(),
};
