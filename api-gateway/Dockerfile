FROM node:20-alpine AS builder

WORKDIR /build
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine

LABEL maintainer="movie-rec-platform"
LABEL service="api-gateway"

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY --from=builder /build/dist ./dist/

ENV NODE_ENV=production
ENV GATEWAY_PORT=4000

EXPOSE 4000

RUN chown -R node:node /app
USER node

CMD ["node", "dist/index.js"]
