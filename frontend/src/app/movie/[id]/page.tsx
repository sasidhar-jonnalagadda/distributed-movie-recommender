"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { FiPlus, FiCheck, FiStar } from "react-icons/fi";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import MovieRow from "@/components/MovieRow";
import { useAuth } from "@/hooks/useAuth";
import type { Movie, RecommendedMovie, RecommendationData, WatchlistItem } from "@/types";

const FALLBACK_POSTER = "https://placehold.co/500x750/333/FFFFFF?text=No+Poster";

export default function MovieDetailPage() {
  const params = useParams();
  const movieId = Number(params.id);
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  const { data: movie, isLoading: movieLoading } = useQuery({
    queryKey: ["movie", movieId],
    queryFn: () => api.get<Movie>(`/movies/${movieId}`),
  });

  const { data: recData, isLoading: recLoading } = useQuery({
    queryKey: ["recommendations", movieId],
    queryFn: () => api.get<RecommendationData>(`/recommend/${movieId}`, { params: { num: 10 } }),
  });

  const recommendations = recData?.recommendations || [];

  const { data: watchlistData } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => api.get<{ items: WatchlistItem[] }>("/watchlist"),
    enabled: isLoggedIn,
  });

  const inWatchlist = watchlistData?.items?.some((item) => item.movieId === movieId) ?? false;

  const toggleWatchlist = async () => {
    if (!isLoggedIn) {
      toast.error("Sign in to add movies to your list");
      return;
    }

    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${movieId}`);
        toast.success("Removed from your list");
      } else {
        await api.post("/watchlist", {
          movieId: movie?.movie_id,
          movieTitle: movie?.title,
          posterUrl: movie?.posterUrl 
            ? (movie.posterUrl.startsWith("http") ? movie.posterUrl : `https://image.tmdb.org/t/p/w500${movie.posterUrl}`)
            : FALLBACK_POSTER,
        });
        toast.success("Added to your list");
      }
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    } catch {
      toast.error("Failed to update watchlist");
    }
  };

  const loading = movieLoading || recLoading;

  if (loading) {
    return (
      <div className="movie-detail">
        <div className="loading-spinner" style={{ minHeight: "80vh" }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="movie-detail">
        <div className="loading-spinner" style={{ minHeight: "80vh", flexDirection: "column" }}>
          <p style={{ color: "var(--text-muted)" }}>Movie not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="movie-detail" id="movie-detail-page">
      <div
        className="movie-detail-backdrop"
        style={{
          backgroundImage: `url(${movie.backdropUrl || movie.posterUrl || ""})`,
        }}
      />

      <div className="movie-detail-content">
        <div className="movie-detail-poster">
          <Image
            src={movie.posterUrl || FALLBACK_POSTER}
            alt={movie.title}
            width={250}
            height={375}
            priority
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_POSTER;
            }}
          />
        </div>

        <div className="movie-detail-info">
          <h1>{movie.title}</h1>

          <div className="movie-detail-meta">
            {movie.year && <span>{movie.year}</span>}
            {movie.vote_average && (
              <span>
                <FiStar style={{ verticalAlign: "middle" }} />{" "}
                {movie.vote_average} / 10
              </span>
            )}
            {movie.voteCount && <span>{movie.voteCount.toLocaleString()} votes</span>}
          </div>

          {movie.genres && movie.genres.length > 0 && (
            <div className="movie-detail-genres">
              {movie.genres.map((genre) => (
                <span key={genre.id} className="genre-tag">
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "var(--space-md)", marginBottom: "var(--space-xl)" }}>
            <button
              type="button"
              className={`btn ${inWatchlist ? "btn-secondary" : "btn-primary"}`}
              onClick={toggleWatchlist}
              id="watchlist-toggle"
            >
              {inWatchlist ? <FiCheck /> : <FiPlus />}
              {inWatchlist ? "In My List" : "Add to My List"}
            </button>
          </div>

          {movie.overview && (
            <p className="movie-detail-overview">{movie.overview}</p>
          )}
        </div>
      </div>

      <div style={{ marginTop: "var(--space-3xl)" }}>
        <MovieRow
          title="More Like This"
          movies={recommendations}
        />
      </div>
    </div>
  );
}
