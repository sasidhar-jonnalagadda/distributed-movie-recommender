"use client";

import Image from "next/image";
import Link from "next/link";
import { FiStar } from "react-icons/fi";
import type { Movie } from "@/types";

interface MovieCardProps {
  movie: Movie;
}

const FALLBACK_POSTER = "https://placehold.co/500x750/333/FFFFFF?text=No+Poster";

/**
 * Individual Movie Card.
 * Features optimized image loading, poster fallback, and strict typing.
 */
export default function MovieCard({ movie }: MovieCardProps) {
  const { movie_id, title, posterUrl, vote_average, year } = movie;

  return (
    <Link
      href={`/movie/${movie_id}`}
      className="movie-card"
      id={`movie-card-${movie_id}`}
      aria-label={`View details for ${title}`}
    >
      <div className="movie-card-poster-container">
        <Image
          src={posterUrl || FALLBACK_POSTER}
          alt={`Poster for ${title}`}
          fill
          sizes="(max-width: 768px) 140px, 200px"
          className="movie-card-poster"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_POSTER;
          }}
        />
      </div>
      <div className="movie-card-info">
        <div className="movie-card-title">{title}</div>
        <div className="movie-card-meta">
          {year && <span className="text-sm">{year}</span>}
          {vote_average && (
            <span className="movie-card-rating text-sm">
              <FiStar size={12} style={{ verticalAlign: "middle", marginBottom: "2px" }} />{" "}
              {vote_average.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
