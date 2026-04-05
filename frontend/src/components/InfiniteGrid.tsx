"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import MovieCard from "./MovieCard";
import Skeleton from "./Skeleton";
import ErrorBanner from "./ErrorBanner";
import { useInfiniteMovies } from "@/hooks/useInfiniteMovies";

interface InfiniteGridProps {
  search?: string;
}

/**
 * Responsive grid that implements infinite scrolling for movie discovery.
 * Handles loading, error, empty, and degraded service states.
 */
export default function InfiniteGrid({ search }: InfiniteGridProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteMovies(search);

  const { ref: sentinelRef, inView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 1. Initial Loading State
  if (isLoading) {
    return (
      <div className="movie-grid" aria-busy="true" aria-label="Loading movies">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  // 2. Error States
  if (isError) {
    // Note: error message is already extracted by our API client interceptor
    const message = error instanceof Error ? error.message : "Failed to load movies";
    const isCircuitOpen = message.toLowerCase().includes("rebooting");
    
    return (
      <div className="movie-grid">
        <ErrorBanner 
          message={message}
          onRetry={() => refetch()}
          variant={isCircuitOpen ? "warning" : "danger"}
        />
      </div>
    );
  }

  const allMovies = data?.pages.flatMap((page) => page.movies) ?? [];
  const isFallback = data?.pages[0]?.fallback;

  // 3. Empty State
  if (allMovies.length === 0 && !isLoading) {
    return (
      <div className="empty-state">
        <h3 className="empty-state-title">No movies found</h3>
        <p className="empty-state-text">
          Try a different search term or browse the catalog.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Movie Results">
      {/* 4. Degraded Service Warning */}
      {isFallback && (
        <div className="alert-banner alert-warning" role="alert">
          Note: AI-powered sorting is temporarily limited. Results may vary.
        </div>
      )}

      <div className="movie-grid" id="movie-grid" role="feed" aria-busy={isFetchingNextPage}>
        {allMovies.map((movie) => (
          <MovieCard key={movie.movie_id} movie={movie} />
        ))}
      </div>

      <div ref={sentinelRef} className="loading-spinner">
        {isFetchingNextPage ? (
          <div className="movie-grid" style={{ width: "100%", marginTop: "var(--space-xl)" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`next-${i}`} />
            ))}
          </div>
        ) : null}
      </div>

      {!hasNextPage && allMovies.length > 0 && (
        <p className="text-muted" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
          You&apos;ve reached the end — {allMovies.length} movies loaded
        </p>
      )}
    </section>
  );
}
