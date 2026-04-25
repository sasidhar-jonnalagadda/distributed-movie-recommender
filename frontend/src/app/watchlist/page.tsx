"use client";

import Image from "next/image";
import Link from "next/link";
import { FiTrash2, FiFilm } from "react-icons/fi";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { WatchlistItem } from "@/types";

const FALLBACK_POSTER = "https://placehold.co/500x750/333/FFFFFF?text=No+Poster";

export default function WatchlistPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading: itemsLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => api.get<{ items: WatchlistItem[] }>("/watchlist"),
    enabled: isLoggedIn && !authLoading,
  });

  const items = data?.items || [];
  const loading = authLoading || (isLoggedIn && itemsLoading);

  const removeItem = async (movieId: number) => {
    try {
      await api.delete(`/watchlist/${movieId}`);
      queryClient.setQueryData(["watchlist"], (old: any) => ({
        ...old,
        items: old.items.filter((i: WatchlistItem) => i.movieId !== movieId),
      }));
      toast.success("Removed from watchlist");
    } catch {
      toast.error("Failed to remove");
    }
  };

  if (!isLoggedIn && !authLoading) {
    return (
      <div className="watchlist-page">
        <div className="watchlist-empty">
          <h2>Sign in to view your watchlist</h2>
          <Link href="/login" className="btn btn-primary" style={{ marginTop: "var(--space-md)" }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="watchlist-page">
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-page" id="watchlist-page">
      <h1>My List</h1>

      {items.length === 0 ? (
        <div className="watchlist-empty">
          <FiFilm size={48} />
          <h2>Your watchlist is empty</h2>
          <p style={{ marginBottom: "var(--space-lg)" }}>
            Browse movies and add them to your list to watch later.
          </p>
          <Link href="/browse" className="btn btn-primary">
            Browse Movies
          </Link>
        </div>
      ) : (
        <div className="movie-grid">
          {items.map((item) => (
            <div key={item.id} className="movie-card" style={{ position: "relative" }}>
              <Link href={`/movie/${item.movieId}`}>
                <Image
                  src={item.posterUrl || FALLBACK_POSTER}
                  alt={item.movieTitle}
                  width={200}
                  height={300}
                  className="movie-card-poster"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_POSTER;
                  }}
                />
                <div className="movie-card-info">
                  <div className="movie-card-title">{item.movieTitle}</div>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => removeItem(item.movieId)}
                className="btn btn-ghost"
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "rgba(0,0,0,0.7)",
                  borderRadius: "50%",
                  padding: "6px",
                }}
                aria-label="Remove from watchlist"
                id={`remove-${item.movieId}`}
              >
                <FiTrash2 size={16} color="#e50914" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
