# Contributing Guidelines

I appreciate your interest in contributing. To maintain the architectural integrity of this microservices platform, please adhere to the following strict guidelines:

## Local Development
1. Fork the repository and create a feature branch (`feat/your-feature` or `fix/your-bug`).
2. Ensure you have Docker and Docker Compose installed.
3. Copy `.env.example` to `.env` and fill in the required keys (specifically the TMDB API key).
4. Run the local cluster: `docker compose up --build`.

## Architectural Rules
* **No Direct DB Access from ML Service:** The Python ML Service must *only* handle vector mathematics and inference. All database reads/writes must be routed through the Node.js API Gateway to maintain caching consistency.
* **Typing:** Strict typing is enforced. Use Zod in Node.js and Pydantic in FastAPI. PRs failing type-checks will be automatically rejected.
* **Dependencies:** Do not add external heavy dependencies (like `scipy` or `scikit-learn`) to the ML service if the operation can be performed efficiently using native `NumPy` array operations.

## Pull Request Process
1. Ensure your code strictly adheres to the `.editorconfig` rules.
2. Provide a detailed summary of your changes, including any impact on inference latency or database query times.
3. Open the PR against the `main` branch.