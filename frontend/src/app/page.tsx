"use client";

import { useEffect, useState } from "react";
import HeroSection from "@/components/HeroSection";
import MovieRow from "@/components/MovieRow";
import client from "@/lib/api";
import type { Movie, PaginatedResponse } from "@/types";

/**
 * Application Home Page (Client Component).
 * Fetches data on the client side to survive free-tier server cold starts.
 */
export default function HomePage() {
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const data = await client.get<PaginatedResponse<Movie>>("/movies?limit=40");
        
        // Handle unwrapped data depending on your API response structure
        const moviesArray = data.movies || (data as any);

        if (moviesArray?.length > 0) {
          // Select a random movie from the top 10 for the featured section
          const topTen = moviesArray.slice(0, 10);
          setFeaturedMovie(topTen[Math.floor(Math.random() * topTen.length)]);

          // Standard trending (recent)
          setTrendingMovies(moviesArray.slice(0, 20));

          // Top rated (sorted by average)
          const sortedMovies = [...moviesArray].sort(
            (a: Movie, b: Movie) => (b.vote_average ?? 0) - (a.vote_average ?? 0)
          );
          setTopRatedMovies(sortedMovies.slice(0, 20));
        }
      } catch (err) {
        console.error("Failed to load home content:", err);
      } finally {
        // Stop loading regardless of success or failure
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 pb-12 text-center px-4 text-white">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-semibold mb-2">Waking up the AI Engine...</h2>
        <p className="text-gray-400 max-w-md">
          Since we are running on free-tier cloud architecture, the database and backend services take about 50 seconds to boot up on the first visit. Hang tight, no need to refresh!
        </p>
      </div>
    );
  }

  return (
    <div className="page-content" id="home-page">
      {featuredMovie && <HeroSection movie={featuredMovie} />}

      <section aria-label="Movie Collections">
        <MovieRow title="Trending Now" movies={trendingMovies} />
        <MovieRow title="Top Rated" movies={topRatedMovies} />
      </section>
    </div>
  );
}