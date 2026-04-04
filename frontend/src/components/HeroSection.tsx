"use client";

import Link from "next/link";
import { FiPlay, FiInfo } from "react-icons/fi";
import type { Movie } from "@/types";

interface HeroSectionProps {
  movie: Movie;
}

export default function HeroSection({ movie }: HeroSectionProps) {
  const backdropUrl =
    movie.backdropUrl ||
    movie.posterUrl ||
    "https://placehold.co/1920x1080/141414/333?text=CINEVERSE";

  return (
    <section
      className="hero"
      style={{ backgroundImage: `url(${backdropUrl})` }}
      id="hero-section"
    >
      <div className="hero-content">
        <h1 className="hero-title">{movie.title}</h1>
        {movie.overview && (
          <p className="hero-overview">{movie.overview}</p>
        )}
        <div className="hero-actions">
          <Link href={`/movie/${movie.movie_id}`} className="btn btn-primary">
            <FiPlay /> Watch Details
          </Link>
          <Link href={`/movie/${movie.movie_id}`} className="btn btn-secondary">
            <FiInfo /> More Info
          </Link>
        </div>
      </div>
    </section>
  );
}
