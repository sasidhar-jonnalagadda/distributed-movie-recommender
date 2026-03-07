import os
from pathlib import Path
from pydantic import Field, computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings for the Movie Recommendation ML Service.
    Values are loaded from environment variables with sensible defaults.
    """
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Application Metadata
    APP_TITLE: str = "Movie Recommendation ML Service"
    APP_DESCRIPTION: str = "Internal microservice providing content-based movie recommendations."
    VERSION: str = "1.0.0"

    # Server Configuration
    HOST: str = Field("0.0.0.0", description="Host address to bind the server to")
    PORT: int = Field(8000, description="Port to listen on", ge=1, le=65535)
    
    # Logging Configuration
    LOG_LEVEL: str = Field("INFO", description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)")
    LOG_FORMAT: str = Field(
        "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
        description="Standard logging format string"
    )

    # Security Configuration
    ALLOWED_ORIGINS: list[str] = Field(["*"], description="CORS allowed origins")

    # Model Configuration
    MODEL_PATH: Path = Field(
        default=Path(__file__).resolve().parent.parent.parent / "artifacts",
        description="Directory containing the pickled model files"
    )

    @field_validator("MODEL_PATH")
    @classmethod
    def validate_model_path(cls, v: Path) -> Path:
        if not v.exists():
            # In production, we might want to raise an error, 
            # but for development, we'll just log a warning or let the loader handle it.
            return v
        return v

    @computed_field
    @property
    def MOVIE_DICT_FILE(self) -> Path:
        return self.MODEL_PATH / "movie_dict.pkl"

    @computed_field
    @property
    def SIMILARITY_FILE(self) -> Path:
        return self.MODEL_PATH / "similarity.pkl"

    # API Configuration
    DEFAULT_PAGE_SIZE: int = Field(20, ge=1, le=100)
    MAX_PAGE_SIZE: int = Field(50, ge=1, le=500)
    DEFAULT_NUM_RECOMMENDATIONS: int = Field(10, ge=1, le=100)


# Create a singleton instance for use throughout the application
settings = Settings()
