from fastapi import APIRouter, HTTPException

from app.models.recommender import recommender
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """
    Performs a system health check and returns operational status.
    
    Verifies that the recommendation model is loaded and provides a count of 
    active records in the dataset.
    """
    if not recommender.is_ready:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    
    return HealthResponse(
        status="ok",
        version="1.0.0",
        model_ready=True,
        total_movies=recommender.get_total_count(),
    )
