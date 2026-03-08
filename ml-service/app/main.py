import logging
import sys
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.recommender import recommender
from app.routes import health, movies, recommend


def setup_logging():
    """Configures application-wide logging based on settings."""
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
        format=settings.LOG_FORMAT,
        handlers=[logging.StreamHandler(sys.stdout)]
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Manages the application lifecycle.
    Loads model artifacts on startup and ensures clean resource release on shutdown.
    """
    setup_logging()
    logger = logging.getLogger(__name__)
    
    logger.info("Initializing %s v%s", settings.APP_TITLE, settings.VERSION)
    logger.info("Starting model load process...")
    
    try:
        recommender.load(settings.MOVIE_DICT_FILE, settings.SIMILARITY_FILE)
        logger.info("✓ Recommendation engine is ready")
    except Exception as exc:
        logger.critical("✗ CRITICAL FAILURE: Failed to load models: %s", exc)
        # Fail fast to ensure the orchestrator (Docker/K8s) restarts the service
        raise SystemExit(1) from exc
    
    yield
    
    logger.info("Shutting down %s...", settings.APP_TITLE)


app = FastAPI(
    title=settings.APP_TITLE,
    description=settings.APP_DESCRIPTION,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Register Routes
app.include_router(health.router)
app.include_router(movies.router)
app.include_router(recommend.router)


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {
        "service": settings.APP_TITLE,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
    }


if __name__ == "__main__":
    # Allows running the service directly via `python app/main.py`
    uvicorn.run(
        "app.main:app", 
        host=settings.HOST, 
        port=settings.PORT, 
        reload=True if settings.LOG_LEVEL == "DEBUG" else False
    )
