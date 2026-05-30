"use client";

import { useEffect, useState } from "react";
import HeroSection from "@/components/HeroSection";
import MovieRow from "@/components/MovieRow";
import client from "@/lib/api";
import type { Movie, PaginatedResponse } from "@/types";

export default function HomePage() {
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Prevents state updates if the user clicks away

    const fetchHomeData = async () => {
      let attempts = 0;
      const maxAttempts = 15; // Give it up to 75 seconds of patient retrying

      while (attempts < maxAttempts && isMounted) {
        try {
          const data = await client.get<PaginatedResponse<Movie>>("/movies?limit=40");
          const moviesArray = data.movies || (data as any);

          if (moviesArray?.length > 0) {
            const topTen = moviesArray.slice(0, 10);
            setFeaturedMovie(topTen[Math.floor(Math.random() * topTen.length)]);
            setTrendingMovies(moviesArray.slice(0, 20));

            const sortedMovies = [...moviesArray].sort(
              (a: Movie, b: Movie) => (b.vote_average ?? 0) - (a.vote_average ?? 0)
            );
            setTopRatedMovies(sortedMovies.slice(0, 20));
          }

          // SUCCESS! Stop the loading spinner and break out of the loop
          if (isMounted) setIsLoading(false);
          break; 

        } catch (err) {
          attempts++;
          console.warn(`Server waking up... Frontend retrying (${attempts}/${maxAttempts})`);
          
          if (attempts >= maxAttempts) {
            console.error("Failed to load home content after maximum retries.");
            if (isMounted) setIsLoading(false); // Give up and show empty screen
            break;
          }
          
          // Wait 5 seconds before knocking on Render's door again
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    };

    fetchHomeData();

    return () => {
      isMounted = false; // Cleanup function
    };
  }, []);

  // The "Bulletproof" Centered Loading Overlay
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] text-center px-4 text-white">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-3xl font-bold mb-4">Waking up the AI Engine...</h2>
        <p className="text-gray-400 max-w-lg text-lg leading-relaxed">
          Since we are running on free-tier cloud architecture, the database and backend services take about 50 to 80 seconds to fully boot up. 
          <br/><br/>
          <span className="text-blue-400 font-semibold">Hang tight, the system is automatically retrying. No need to refresh!</span>
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