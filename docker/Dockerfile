# syntax=docker/dockerfile:1
# ==============================================================================
# Stage 1: Base runtime
# ==============================================================================
FROM node:24-slim AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        openssl \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@latest

RUN groupadd -r appgroup && useradd -r -g appgroup -d /home/appuser -m appuser


# ==============================================================================
# Stage 2: Development dependencies (includes Prisma CLI)
# ==============================================================================
FROM base AS dev-deps

ENV NODE_ENV=development

RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
    && rm -rf /var/lib/apt/lists/*

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

ENV DATABASE_URL="file:/tmp/pancolle-generate.db"

RUN pnpm install --frozen-lockfile


# ==============================================================================
# Stage 3: Development runtime / tooling
# ==============================================================================
FROM dev-deps AS dev

COPY . .

RUN mkdir -p /app/data /app/.next && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

CMD ["/app/node_modules/.bin/next", "dev", "-H", "0.0.0.0", "-p", "3000"]


# ==============================================================================
# Stage 4: Builder (creates production Next.js build, then prunes dev deps)
# ==============================================================================
FROM dev-deps AS builder

ENV NODE_ENV=production

COPY . .

ARG BUILD_DATABASE_URL="file:/tmp/pancolle-build.db"
ENV DATABASE_URL=${BUILD_DATABASE_URL}

RUN pnpm db:setup && \
    pnpm db:seed && \
    pnpm build && \
    pnpm prune --prod --ignore-scripts


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
COPY --from=builder --chown=appuser:appgroup /app/docs/legal/ ./docs/legal/
COPY --from=builder --chown=appuser:appgroup /app/.next ./.next
COPY --from=builder --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=builder --chown=appuser:appgroup /app/prisma.config.ts ./prisma.config.ts

USER appuser

EXPOSE 3000

CMD ["/app/node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]