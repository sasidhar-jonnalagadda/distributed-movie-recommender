# Distributed Movie Recommender

A high-performance, enterprise-grade distributed microservice platform for delivering ultra-low-latency movie recommendations. Built from the ground up to demonstrate modern architectural patterns including Incremental Static Regeneration (ISR), Circuit Breaking, and Zero-Downtime Machine Learning model hot-reloading.

---

## 🏛️ Architecture Overview

The platform operates on a resilient, 3-tier microservice architecture orchestrated seamlessly via Docker Compose.

```text
                     [ External TMDB API ]
                               |
                               v
[ Client Browser ] <--> [ Next.js Frontend ] (Port 3000)
                               |
                               v
                     [ Node API Gateway ] (Port 4000)
                               |
            +------------------+------------------+
            |                                     |
            v                                     v
[ Python ML Service ] (Port 8000)        [ PostgreSQL DB ] (Port 5432)
```

1. **Frontend (Next.js):** Handles the UI and client-side state. Utilizes Server Components and ISR for lightning-fast initial page loads, and React Query for dynamic client-side interactions.
2. **API Gateway (Node.js/Express):** Acts as the centralized orchestrator. It securely manages JWT authentication, routes traffic, rate limits requests, and implements Circuit Breaker patterns to protect downstream services.
3. **ML Service (Python/FastAPI):** A high-throughput, memory-optimized recommendation engine using NumPy matrix operations to compute real-time cosine similarity scores.
4. **Database (PostgreSQL):** A persistent storage layer housing user profiles, authentication records, and individual watchlists.

---

## 🛠️ Tech Stack

**Frontend**
* Framework: Next.js 14 (App Router)
* State Management: TanStack React Query
* Styling: Vanilla CSS (Tokens & Utilities)
* Type Safety: TypeScript

**Backend (API Gateway)**
* Framework: Node.js with Express
* Database ORM: Prisma / Sequelize
* Security: Helmet, Express Rate Limit, JWT
* Architecture: Axios Interceptors & Circuit Breakers

**Machine Learning Service**
* Framework: FastAPI (Python)
* Data Processing: Pandas & NumPy
* Validation: Pydantic Strict Typing

**DevOps & Infrastructure**
* Containerization: Docker & Docker Compose
* Deployment: Multi-stage, non-root hardened images

---

## ✨ Key Features

* **ISR Caching:** The frontend heavily leverages Next.js Incremental Static Regeneration to serve pre-rendered pages instantly while validating data in the background.
* **Circuit Breaker Pattern:** The API Gateway intelligently cuts off traffic to the ML service if it detects latency spikes or failures, returning graceful fallbacks to the frontend.
* **ML Model Hot-Reloading:** The ML service utilizes thread-safe locking and atomic swapping to hot-reload similarity matrices in-memory via an API endpoint, achieving absolute zero-downtime model updates.
* **Aggressive Rate Limiting:** Critical endpoints (like authentication and token refreshing) are protected against brute-force attacks via strict rate limiters.
* **A11y & SEO:** Built strictly adhering to semantic HTML, aria-labels, and modern accessibility standards.

---

## 🚀 Prerequisites & Setup

### 1. Requirements
Ensure you have the following installed:
* [Docker](https://docs.docker.com/get-docker/)
* [Docker Compose](https://docs.docker.com/compose/install/)

### 2. Environment Configuration
The application relies on specific environment variables to function correctly. You must create an `.env` file at the root of the repository.

1. Copy the provided template:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your secrets. At a minimum, ensure the following are set:
   ```env
   # Database Credentials
   DB_USER=movieuser
   DB_PASSWORD=your_secure_password_here
   DB_NAME=moviedb

   # JWT Security (Generate with: openssl rand -base64 32)
   JWT_SECRET=your_jwt_secret_here

   # The Movie Database API (Required for metadata & posters)
   # Get your API key from: https://www.themoviedb.org/settings/api
   TMDB_API_KEY=your_tmdb_api_key_here
   ```

### 3. Running the App

Once your `.env` file is configured, start the entire distributed cluster in detached mode using Docker Compose:

```bash
docker compose up --build -d
```

### 4. Accessing the Services
Once all containers have started and passed their internal health checks, the services will be available at:
* **Frontend UI:** [http://localhost:3000](http://localhost:3000)
* **API Gateway Health:** [http://localhost:4000/api/health](http://localhost:4000/api/health)
* **ML Service Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🤝 Contributing
Please read through our [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us. Note that this project strictly enforces `.editorconfig` spacing conventions.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
