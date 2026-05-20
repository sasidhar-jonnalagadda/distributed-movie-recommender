FROM python:3.12-slim AS builder

WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim

LABEL maintainer="movie-rec-platform"
LABEL service="ml-service"

WORKDIR /app

COPY --from=builder /install /usr/local

COPY app/ ./app/

ENV MODEL_PATH=/app/artifacts
ENV HOST=0.0.0.0
ENV PORT=8000

EXPOSE 8000

RUN apt-get update && apt-get install -y wget && \
    mkdir -p /app/artifacts && \
    wget -O /app/artifacts/movie_dict.pkl "https://github.com/sasidhar-jonnalagadda/distributed-movie-recommender/releases/download/v1.0.0/movie_dict.pkl" && \
    wget -O /app/artifacts/similarity.pkl "https://github.com/sasidhar-jonnalagadda/distributed-movie-recommender/releases/download/v1.0.0/similarity.pkl" && \
    apt-get remove -y wget && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]