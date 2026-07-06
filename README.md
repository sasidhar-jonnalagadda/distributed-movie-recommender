# Movie Recommendation Engine

A full-stack movie discovery web application featuring an interactive user dashboard linked with a customized Python processing backend script optimized for efficient recommendation retrieval.

---

## 🏛️ Architecture Overview

The platform operates on a clean, synchronous 3-tier architecture designed to connect front-end routing with database caching and data analytics logic.

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

- **Frontend (Next.js):** Handles the user interface, browsing dashboard, dynamic watchlists, and client-side data state tracking using React components.
- **API Backend (Node.js/Express):** Acts as the central app controller. It securely manages user routes, handles JWT-based cookie authorization, and communicates with the Python processing layer.
- **Analytics Backend (Python/FastAPI):** A high-performance computation script using NumPy's quickselect structures to instantly handle mathematical array comparisons.
- **Database (PostgreSQL):** A reliable, persistent relational database holding user credentials, watchlist associations, and an internal metadata cache.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js (App Router)
- **Client-Side Data:** TanStack React Query
- **Styling:** Vanilla CSS (Tokens & Custom Utilities)
- **Language:** TypeScript

### Backend & APIs
- **Environment:** Node.js with Express.js
- **Database Mapper:** Prisma ORM
- **Security & Auth:** Helmet, Express Rate Limit, Jsonwebtoken (JWT)
- **Data Gateway:** Axios Client Requests

### Data Processing Layer
- **Framework:** FastAPI (Python)
- **Manipulation Engine:** NumPy & Pandas

### Databases & Tools
- **Database:** PostgreSQL
- **API Verification:** Postman
- **Version Control:** Git

---

## ✨ Key Features

- **Linear Selection Logic (O(N)):** Optimizes standard processing matrix queries using an element partitioning system to retrieve recommendations swiftly without using blocking full-array sort algorithms.
- **Local Metadata Caching:** Implements a relational caching structure in PostgreSQL to look up previously requested metadata locally, drastically reducing repetitive network trips to external services.
- **Axios Interceptor Synced Queues:** Uses an authentication layer interceptor pipeline to refresh expired tokens seamlessly without triggering race conditions or duplicate network overhead.
- **JWT Cookie Protection:** Secures application authorization paths by handling token states exclusively through server-verified HTTP-only cookies.

---

## 🚀 Local Installation & Setup

### 1. Environment Configuration

Create a `.env` file at the root of your project directory and add the following keys:

```env
# Database Configuration
DATABASE_URL="postgresql://movieuser:your_password@localhost:5432/moviedb"

# Authentication Controls
JWT_SECRET="your_custom_jwt_secret_token_string"

# External Movie Database Details
TMDB_API_KEY="your_tmdb_api_key"
```

### 2. Starting the Backends

**For the Python Analytics Service:**

```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

**For the Express.js Server:**

```bash
cd api-gateway
npm install
npx prisma db push
npm run start
```

### 3. Starting the Frontend UI

```bash
cd frontend
npm install
npm run dev
```

Once running, the application will be active locally at:

- **User Application Dashboard:** http://localhost:3000
- **API Ingress Controller:** http://localhost:4000
- **Python Processing Documentation:** http://localhost:8000/docs
