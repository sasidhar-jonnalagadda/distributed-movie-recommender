from typing import Annotated
from fastapi import APIRouter, HTTPException, Query, Path, BackgroundTasks
import logging
 
from app.config import settings
from app.models.recommender import recommender
from app.schemas.recommendation import RecommendationResponse, RecommendedMovie

router = APIRouter(prefix="/recommend", tags=["recommendations"])
logger = logging.getLogger(__name__)


@router.get(
    "/{movie_id}", 
    response_model=RecommendationResponse,
    responses={
        404: {"description": "Source movie not found"},
        503: {"description": "Model engine not ready"},
        500: {"description": "Internal recommendation error"}
    }
)
def get_recommendations(
    movie_id: Annotated[int, Path(description="The ID of the movie to get recommendations for", ge=1)],
    num: Annotated[int, Query(description="Number of recommendations to return", ge=1, le=50)] = settings.DEFAULT_NUM_RECOMMENDATIONS,
    min_similarity: Annotated[float, Query(description="Minimum similarity score threshold (0.0-1.0)", ge=0.0, le=1.0)] = 0.2,
) -> RecommendationResponse:
    """
    Retrieves Top-N movie recommendations for a given movie ID.
    
    Complexity: O(N) selection using NumPy argpartition. 
    Returns a list of movies sorted by descending similarity score.
    """
    if not recommender.is_ready:
        raise HTTPException(status_code=503, detail="Model engine not ready")

    try:
        # Check if the movie actually exists before getting recommendations
        movie = recommender.get_movie_by_id(movie_id)
        if movie is None:
            raise HTTPException(status_code=404, detail="Source movie not found")

        results = recommender.recommend(
            movie_id=movie_id, 
            num=num, 
            min_similarity=min_similarity
        )
        
        return RecommendationResponse(
            source_movie_id=movie_id,
            recommendations=[RecommendedMovie(**r) for r in results],
            count=len(results),
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("Unexpected error during recommendation for movie_id %d: %s", movie_id, str(e))
        raise HTTPException(status_code=500, detail="Internal recommendation error")


@router.post(
    "/reload", 
    status_code=202,
    responses={202: {"description": "Model reload initiated in background"}}
)
async def reload_models(background_tasks: BackgroundTasks) -> dict:
    """
    Triggers an in-memory reload of the recommendation models.
    
    The swap is atomic and does not disrupt active requests. 
    Check logs for 'Successfully reloaded models via API' for completion status.
    """
    def do_reload():
        try:
            logger.info("Initiating model reload...")
            recommender.load(settings.MOVIE_DICT_FILE, settings.SIMILARITY_FILE)
            logger.info("✓ Successfully reloaded models via API")
        except Exception as e:
            logger.error("✗ Failed to reload models via API: %s", str(e))

    background_tasks.add_task(do_reload)
    return {"message": "Model reload initiated in background"}
