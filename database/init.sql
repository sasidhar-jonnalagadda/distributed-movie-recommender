CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100) NOT NULL,
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE watchlists (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id    INTEGER NOT NULL,
    movie_title VARCHAR(500) NOT NULL,
    poster_url  TEXT,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, movie_id)
);

CREATE INDEX idx_watchlists_user ON watchlists(user_id);

CREATE TABLE watch_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id    INTEGER NOT NULL,
    watched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rating      SMALLINT CHECK (rating BETWEEN 1 AND 10)
);

CREATE INDEX idx_history_user ON watch_history(user_id);
CREATE INDEX idx_history_movie ON watch_history(movie_id);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);

CREATE TABLE movie_metadata (
    movie_id      INTEGER PRIMARY KEY,
    poster_path   TEXT,
    backdrop_path TEXT,
    overview      TEXT,
    genres        JSONB,
    release_date  VARCHAR(20),
    vote_average  DECIMAL(3, 1),
    vote_count    INTEGER,
    last_updated  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metadata_movie_id ON movie_metadata(movie_id);
