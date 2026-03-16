from pydantic import BaseModel, Field, ConfigDict


class HealthResponse(BaseModel):
    """
    Standardized response schema for service health and diagnostic information.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "ok",
                "version": "1.0.0",
                "model_ready": True,
                "total_movies": 4803
            }
        }
    )

    status: str = Field(..., description="Overall service operational status (e.g., 'ok')")
    version: str = Field(..., description="Current version of the ML service")
    model_ready: bool = Field(..., description="Indicates if the recommendation model is loaded in memory")
    total_movies: int = Field(..., description="Number of movies currently active in the dataset", ge=0)
