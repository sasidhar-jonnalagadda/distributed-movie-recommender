from typing import Optional, Annotated
from pydantic import BaseModel, Field, ConfigDict


class MovieBase(BaseModel):
    """
    Base schema for movie data, containing core identity and technical metadata.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "movie_id": 19995,
                "title": "Avatar",
                "year": 2009,
                "vote_average": 7.2
            }
        }
    )

    movie_id: int = Field(..., description="Unique TMDB movie ID", ge=1)
    title: str = Field(..., description="Official movie title", min_length=1, max_length=255)
    year: Optional[Annotated[int, Field(ge=1880, le=2100)]] = Field(
        None, description="Release year of the movie"
    )
    vote_average: Optional[Annotated[float, Field(ge=0, le=10)]] = Field(
        None, description="Average audience rating on a scale of 0 to 10"
    )


class MovieDetail(MovieBase):
    """
    Extended schema for a single movie, including descriptive content and assets.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "movie_id": 19995,
                "title": "Avatar",
                "year": 2009,
                "vote_average": 7.2,
                "poster_url": "https://image.tmdb.org/t/p/w500/kyeqYdyv6isSgYpuxvMvY4IRYyS.jpg",
                "overview": "In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora..."
            }
        }
    )

    poster_url: Optional[str] = Field(None, description="Absolute URL to the movie poster image", max_length=1000)
    overview: Optional[str] = Field(None, description="Brief plot summary or synopsis", max_length=2000)


class MovieListResponse(BaseModel):
    """
    Paginated response schema for movie discovery and search endpoints.
    """
    movies: list[MovieBase] = Field(..., description="List of movies for the requested page")
    next_cursor: Optional[int] = Field(
        None, description="Index-based cursor for the next page; null if this is the last page"
    )
    total_count: int = Field(..., description="Total number of movies matching the query", ge=0)
