import HeroSection from "@/components/HeroSection";
import MovieRow from "@/components/MovieRow";
import type { Movie, PaginatedResponse } from "@/types";

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Application Home Page (Server Component).
 * Orchestrates the featured hero section and categorized movie rows.
 */
export default async function HomePage() {
  let featuredMovie: Movie | null = null;
  let trendingMovies: Movie[] = [];
  let topRatedMovies: Movie[] = [];

  try {
    const res = await fetch(`${API_URL}/api/movies?limit=40`, {
  cache: 'no-store'
});

    if (res.ok) {
      const json = await res.json();
      const data: PaginatedResponse<Movie> = json.data || json;

      if (data.movies?.length > 0) {
        // Select a random movie from the top 10 for the featured section
        const topTen = data.movies.slice(0, 10);
        featuredMovie = topTen[Math.floor(Math.random() * topTen.length)];

        // Standard trending (recent)
        trendingMovies = data.movies.slice(0, 20);

        // Top rated (sorted by average)
        topRatedMovies = [...data.movies]
          .sort((a: Movie, b: Movie) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
          .slice(0, 20);
      }
    }
  } catch (err) {
    console.error("Failed to load home content:", err);
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
