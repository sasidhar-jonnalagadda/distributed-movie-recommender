from typing import Optional, Annotated

from fastapi import APIRouter, HTTPException, Query, Path

from app.config import settings
from app.models.recommender import recommender
from app.schemas.movie import MovieBase, MovieListResponse

router = APIRouter(prefix="/movies", tags=["movies"])


@router.get(
    "", 
    response_model=MovieListResponse,
    responses={503: {"description": "Model engine not ready"}}
)
def list_movies(
    cursor: Annotated[Optional[int], Query(description="Pagination cursor (row index)")] = None,
    limit: Annotated[int, Query(ge=1, le=settings.MAX_PAGE_SIZE)] = settings.DEFAULT_PAGE_SIZE,
    search: Annotated[Optional[str], Query(description="Title search (case-insensitive)")] = None,
) -> MovieListResponse:
    """
    Retrieves a paginated list of movies, optionally filtered by title.
    
    This endpoint utilizes the underlying recommendation dataset and supports 
    cursor-based pagination for high-performance scanning.
    """
    if not recommender.is_ready:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    result = recommender.get_movies(cursor=cursor, limit=limit, search=search)
    return MovieListResponse(
        movies=[MovieBase(**m) for m in result["movies"]],
        next_cursor=result["nextCursor"],
        total_count=recommender.get_total_count(),
    )


@router.get(
    "/{movie_id}", 
    response_model=MovieBase,
    responses={
        404: {"description": "Movie not found"},
        503: {"description": "Model engine not ready"}
    }
)
def get_movie(
    movie_id: Annotated[int, Path(description="TMDB movie ID", ge=1)]
) -> MovieBase:
    """
    Retrieves detailed metadata for a specific movie ID.
    """
    if not recommender.is_ready:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    movie = recommender.get_movie_by_id(movie_id)
    if movie is None:
        raise HTTPException(status_code=404, detail="Movie not found")
    return MovieBase(**movie)
