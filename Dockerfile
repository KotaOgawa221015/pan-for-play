# syntax=docker/dockerfile:1
# ==============================================================================
# Stage 1: Base runtime
# ==============================================================================
FROM node:24.14.1-slim AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r appgroup && useradd -r -g appgroup -d /home/appuser -m appuser


# ==============================================================================
# Stage 2: Development dependencies (includes Prisma CLI)
# ==============================================================================
FROM base AS dev-deps

ENV NODE_ENV=development

RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        python3 \
        make \
        g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

ENV DATABASE_URL="file:/tmp/pancolle-generate.db"

RUN npx prisma generate


# ==============================================================================
# Stage 3: Development runtime / tooling
# ==============================================================================
FROM dev-deps AS dev

COPY . .

RUN mkdir -p /app/data /app/.next && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]


# ==============================================================================
# Stage 4: Builder (creates production Next.js build, then prunes dev deps)
# ==============================================================================
FROM dev-deps AS builder

ENV NODE_ENV=production

COPY . .

ARG BUILD_DATABASE_URL="file:/tmp/pancolle-build.db"
ENV DATABASE_URL=${BUILD_DATABASE_URL}

RUN npx prisma migrate deploy && \
    npx prisma db seed && \
    npm run build && \
    npm prune --omit=dev


# ==============================================================================
# Stage 5: Production runtime
# ==============================================================================
FROM base AS prod

ENV NODE_ENV=production

RUN mkdir -p /app/data /app/.next && chown -R appuser:appgroup /app

COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json
COPY --from=builder --chown=appuser:appgroup /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=appuser:appgroup /app/public ./public
COPY --from=builder --chown=appuser:appgroup /app/.next ./.next
COPY --from=builder --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=builder --chown=appuser:appgroup /app/prisma.config.ts ./prisma.config.ts

USER appuser

EXPOSE 3000

CMD ["npm", "run", "start"]
