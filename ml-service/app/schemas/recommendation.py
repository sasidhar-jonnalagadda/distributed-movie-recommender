from pydantic import BaseModel, Field, ConfigDict
from .movie import MovieBase


class RecommendedMovie(MovieBase):
    """
    Schema for a recommended movie, extending the base movie with a similarity score.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "movie_id": 19995,
                "title": "Avatar",
                "year": 2009,
                "vote_average": 7.2,
                "similarity_score": 0.85
            }
        }
    )

    similarity_score: float = Field(
        ..., 
        description="Cosine similarity to the source movie (1.0 = perfect match, 0.0 = no relation)",
        ge=0.0,
        le=1.0
    )


class RecommendationResponse(BaseModel):
    """
    Response schema for the recommendation engine.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "source_movie_id": 19995,
                "recommendations": [
                    {"movie_id": 299536, "title": "Avengers: Infinity War", "similarity_score": 0.72}
                ],
                "count": 1
            }
        }
    )

    source_movie_id: int = Field(..., description="ID of the movie used as the basis for recommendations", ge=1)
    recommendations: list[RecommendedMovie] = Field(..., description="List of similar movies found")
    count: int = Field(..., description="Number of recommendations returned", ge=0)
