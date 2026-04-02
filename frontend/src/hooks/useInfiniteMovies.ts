"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Movie, PaginatedResponse } from "@/types";

/**
 * Custom hook for infinite loading of movie lists.
 * Supports search and standard pagination cursors.
 * 
 * @param search - Optional search string to filter movies by title.
 */
export function useInfiniteMovies(search?: string) {
  return useInfiniteQuery<PaginatedResponse<Movie>>({
    /**
     * Hierarchical query key for better cache management.
     */
    queryKey: ["movies", "infinite", { search }],

    /**
     * Fetcher function using the auto-unwrapping API client.
     */
    queryFn: async ({ pageParam }) => {
      const params: Record<string, any> = { limit: 20 };
      if (pageParam) params.cursor = pageParam;
      if (search) params.search = search;

      return api.get<PaginatedResponse<Movie>>("/movies", { params });
    },

    /**
     * Initial cursor value (matches backend standard).
     */
    initialPageParam: null as number | null,

    /**
     * Calculates the next cursor from the last page's metadata.
     */
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,

    /**
     * Performance optimization: consider data fresh for 1 minute.
     */
    staleTime: 60 * 1000, 
    
    /**
     * Garbage collection: keep unused data in cache for 5 minutes.
     */
    gcTime: 5 * 60 * 1000, 

    /**
     * Intelligent retry strategy for production resilience.
     */
    retry: (failureCount, error: any) => {
      // 1. Don't retry client-side errors (400, 401, 403, 404)
      if (error.response?.status && error.response.status < 500) {
        return false;
      }
      
      // 2. Retry transient server errors up to 2 times
      return failureCount < 2;
    },

    refetchOnWindowFocus: false,
  });
}
