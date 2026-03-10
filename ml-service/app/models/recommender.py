import pickle
import logging
import threading
from pathlib import Path
from typing import Optional, List, Dict, Any, Union

import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


class Recommender:
    """
    Production-grade Content-Based Recommender System.
    
    Provides low-latency movie recommendations using a pre-computed similarity matrix.
    Implements thread-safe model swapping and O(N) selection using NumPy argpartition.
    """

    def __init__(self) -> None:
        self.movies: Optional[pd.DataFrame] = None
        self.similarity: Optional[np.ndarray] = None
        self._ready: bool = False
        self._lock = threading.Lock()

    def load(self, movie_dict_path: Path, similarity_path: Path) -> None:
        """
        Loads the movie database and similarity matrix into memory.
        Uses a lock to ensure thread-safe atomic swapping of models.

        Args:
            movie_dict_path: Path to the pickled movie dictionary.
            similarity_path: Path to the pickled similarity matrix.

        Raises:
            FileNotFoundError: If model files are missing.
            pickle.UnpicklingError: If files are corrupted.
            TypeError: If the loaded data does not match expected types (DataFrame/ndarray).
        """
        logger.info("Starting model load process...")

        try:
            # Load into local variables first
            logger.info("Loading movie dictionary from %s", movie_dict_path)
            with open(movie_dict_path, "rb") as f:
                movies_dict = pickle.load(f)
            
            new_movies = pd.DataFrame(movies_dict)
            if not isinstance(new_movies, pd.DataFrame):
                raise TypeError(f"Expected pd.DataFrame from {movie_dict_path}, got {type(new_movies)}")

            logger.info("Loading similarity matrix from %s", similarity_path)
            with open(similarity_path, "rb") as f:
                new_similarity = pickle.load(f)
            
            if not isinstance(new_similarity, np.ndarray):
                raise TypeError(f"Expected np.ndarray from {similarity_path}, got {type(new_similarity)}")

            # Thread-safe atomic swap
            with self._lock:
                self.movies = new_movies
                self.similarity = new_similarity
                self._ready = True

            logger.info(
                "✓ Models loaded — %d movies, similarity matrix %s",
                len(self.movies),
                getattr(self.similarity, "shape", "unknown"),
            )
        except (FileNotFoundError, pickle.UnpicklingError, ValueError, TypeError) as e:
            logger.error("✗ Failed to load models: %s", str(e))
            with self._lock:
                self._ready = False
            raise

    @property
    def is_ready(self) -> bool:
        """Thread-safe check to see if the model is currently loaded."""
        with self._lock:
            return self._ready

    def _map_movie_row(self, row: Union[pd.Series, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Maps a single movie record to the standardized API schema.
        Handles missing/NaN values safely for JSON serialization.
        """
        # Dictionary-based lookup is faster for pre-mapped records
        get_val = lambda key: row.get(key) if isinstance(row, dict) else row.get(key)
        
        return {
            "movie_id": int(get_val("movie_id")),
            "title": str(get_val("title")),
            "year": int(get_val("year")) if pd.notna(get_val("year")) else None,
            "vote_average": (
                round(float(get_val("vote_average")), 1)
                if pd.notna(get_val("vote_average"))
                else None
            ),
        }

    def recommend(
        self, movie_id: int, num: int = 10, min_similarity: float = 0.2
    ) -> List[Dict[str, Any]]:
        """
        Finds similar movies using a pre-computed similarity matrix.
        
        Complexity: O(N) using NumPy's argpartition to select top candidates,
        avoiding a full sort of the dataset.
        """
        with self._lock:
            if not self._ready or self.movies is None or self.similarity is None:
                raise RuntimeError("Recommendation engine is not ready.")
            movies_df = self.movies
            similarity_mtx = self.similarity

        # Find the index of the source movie
        matches = movies_df[movies_df["movie_id"] == movie_id]
        if matches.empty:
            logger.warning("Movie ID %d not found in dataset.", movie_id)
            return []

        idx = matches.index[0]
        sim_scores = similarity_mtx[idx]

        # Optimization: O(N) using argpartition instead of O(N log N) full sort
        # We pick extra candidates to ensure we have enough after threshold filtering
        n_candidates = min(num + 20, len(sim_scores))
        top_indices = np.argpartition(sim_scores, -n_candidates)[-n_candidates:]
        
        # Sort only the subset of top candidates
        top_indices = top_indices[np.argsort(sim_scores[top_indices])][::-1]

        results: List[Dict[str, Any]] = []
        for i in top_indices:
            score = float(sim_scores[i])
            
            # Skip the source movie and anything below threshold
            if i == idx or score < min_similarity:
                continue

            row = movies_df.iloc[i]
            movie_info = self._map_movie_row(row)
            movie_info["similarity_score"] = round(score, 4)
            results.append(movie_info)

            if len(results) >= num:
                break

        return results

    def get_movies(
        self,
        cursor: Optional[int] = None,
        limit: int = 20,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Returns a paginated list of movies.
        Uses vectorized to_dict('records') for high-performance serialization.
        """
        with self._lock:
            if not self._ready or self.movies is None:
                raise RuntimeError("Database engine is not ready.")
            df = self.movies

        # Apply search filter if provided
        if search:
            df = df[df["title"].str.contains(search, case=False, na=False)]

        # Handle pagination cursor
        start_idx = (cursor + 1) if cursor is not None else 0
        total_filtered = len(df)
        
        # Slice and convert to records (much faster than iterrows)
        page_df = df.iloc[start_idx : start_idx + limit]
        raw_records = page_df.to_dict("records")
        
        # Map to final schema
        movies_list = [self._map_movie_row(record) for record in raw_records]

        # Calculate next cursor
        next_cursor = None
        if len(movies_list) == limit and (start_idx + limit) < total_filtered:
            next_cursor = start_idx + limit - 1

        return {
            "movies": movies_list, 
            "nextCursor": next_cursor,
            "total_count": total_filtered
        }

    def get_movie_by_id(self, movie_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves technical metadata for a specific movie ID."""
        with self._lock:
            if not self._ready or self.movies is None:
                raise RuntimeError("Database engine is not ready.")
            df = self.movies

        matches = df[df["movie_id"] == movie_id]
        if matches.empty:
            return None

        return self._map_movie_row(matches.iloc[0])

    def get_total_count(self) -> int:
        """Returns the total number of movies currently in memory."""
        with self._lock:
            return len(self.movies) if self.movies is not None else 0


# Singleton instance
recommender = Recommender()
