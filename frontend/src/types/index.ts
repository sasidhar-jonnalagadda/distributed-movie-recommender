/**
 * Standard paginated response envelope.
 * Used for lists like movies or search results.
 */
export interface PaginatedResponse<T> {
  movies: T[];
  nextCursor: number | null;
  total_count: number;
  fallback?: boolean;
}

/**
 * Core Movie domain model.
 * Merges internal metadata (ML service) with external details (TMDB).
 */
export interface Movie {
  movie_id: number;
  title: string;
  year: number | null;
  vote_average: number | null;
  
  // Enriched fields (TMDB)
  posterUrl?: string;
  backdropUrl?: string;
  overview?: string;
  genres?: Array<{ id: number; name: string }>;
  releaseDate?: string;
  voteCount?: number;
}

/**
 * Movie recommendation with a calculated similarity score.
 */
export interface RecommendedMovie extends Movie {
  similarity_score: number;
}

/**
 * Full response from the recommendation endpoint.
 */
export interface RecommendationData {
  source_movie_id: number;
  recommendations: RecommendedMovie[];
  count: number;
  fallback?: boolean;
  warning?: string;
}

/**
 * Item in a user's personal watchlist.
 */
export interface WatchlistItem {
  id: string;
  movieId: number;
  movieTitle: string;
  posterUrl: string | null;
  addedAt: string;
}

/**
 * User domain model.
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt?: string;
}

/**
 * Response from authentication endpoints (login/signup).
 */
export interface AuthData {
  user: User;
  accessToken: string;
}

