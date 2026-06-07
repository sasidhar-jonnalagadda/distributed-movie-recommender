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
    let isMounted = true;

    const fetchHomeData = async () => {
      let attempts = 0;
      const maxAttempts = 60; // 5 full minutes of patient retrying for deep hibernation

      client.get(`/health?_t=${Date.now()}`).catch(() => {});

      while (attempts < maxAttempts && isMounted) {
        try {
          // 1. Bypass TS strictness with <any> so we can safely check for hidden .data wrappers
          const rawResponse = await client.get<any>(`/movies?limit=40&_t=${Date.now()}`);
          
          // 2. Defensive Parsing: Safely unwrap the Axios envelope at runtime
          const responseBody = rawResponse?.data ? rawResponse.data : rawResponse;
          const actualData = responseBody?.data ? responseBody.data : responseBody;
          const moviesArray = actualData?.movies ? actualData.movies : actualData;

          // 3. Strict Validation: Ensure we actually got array data before stopping the spinner
          if (Array.isArray(moviesArray) && moviesArray.length > 0) {
            const topTen = moviesArray.slice(0, 10);
            setFeaturedMovie(topTen[Math.floor(Math.random() * topTen.length)]);
            setTrendingMovies(moviesArray.slice(0, 20));

            const sortedMovies = [...moviesArray].sort(
              (a: Movie, b: Movie) => (b.vote_average ?? 0) - (a.vote_average ?? 0)
            );
            setTopRatedMovies(sortedMovies.slice(0, 20));
            
            // SUCCESS! We have the data. Stop the spinner.
            if (isMounted) setIsLoading(false);
            break; 
          } else {
            // If the server returned 200 OK but the DB is still booting and returned empty, force a retry!
            throw new Error("Server awake, but database is not populated yet.");
          }

        } catch (err) {
          attempts++;
          console.warn(`Server/DB waking up... Frontend retrying (${attempts}/${maxAttempts})`);
          
          if (attempts >= maxAttempts) {
            console.error("Failed to load home content after maximum retries.");
            if (isMounted) setIsLoading(false);
            break;
          }
          
          // Wait 5 seconds before trying again
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    };

    fetchHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 4. Layout-Friendly CSS: Uses min-height and massive top-padding to escape the Navbar
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-black text-center px-4 text-white">
        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        
        {/* Text Content */}
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-3xl font-bold mb-4">Waking up the AI Engine...</h2>
          <p className="text-gray-400 max-w-lg text-lg leading-relaxed">
            Since we are running on free-tier cloud architecture, the database and backend services take about 50 to 80 seconds to fully boot up. 
            <br/><br/>
            <span className="text-blue-400 font-semibold">Hang tight, the system is automatically retrying. No need to refresh!</span>
          </p>
        </div>
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