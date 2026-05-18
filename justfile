set shell := ["bash", "-eu", "-o", "pipefail", "-c"]
set dotenv-load

APP_NAME := env("COMPOSE_PROJECT_NAME", "pancolle")

default: help

# List available recipes
help:
    @echo "Usage: just [recipe]"
    @echo ""
    @echo "Development tasks for pancolle:"
    @just --list | tail -n +2 | awk '{printf "  \033[36m%-20s\033[0m %s\n", $1, substr($0, index($0, $2))}'

# Start development server
dev:
    pnpm dev

# Build the application
build:
    pnpm build

# Install dependencies and apply database migrations
setup:
    @if [ ! -f .env ]; then \
        cp .env.example .env; \
        echo "Created .env from .env.example"; \
    fi
    pnpm install
    pnpm exec playwright install
    pnpm exec tsx scripts/db.ts setup

# ==============================================================================
# Code Quality
# ==============================================================================

# Apply formatter and safe lint fixes
fix:
    pnpm format
    pnpm lint:fix

# Run formatting checks, lint, and typecheck
check:
    pnpm format:check
    pnpm lint
    pnpm typecheck

# ==============================================================================
# Docker Environment Commands
# ==============================================================================

# Start development stack
up *args:
    @echo "Starting development stack..."
    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-dev \
        PANCOLLE_BUILD_TARGET=dev \
        docker compose up {{ args }}

# Stop development stack
down:
    @echo "Stopping development stack..."
    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-dev \
        docker compose down --remove-orphans

# Rebuild and restart development stack
rebuild:
    @echo "Rebuilding development stack..."
    @just down
    @just build-dev
    @just up

# Start production stack
up-prod *args:
    @echo "Starting production stack..."
    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-prod \
        PANCOLLE_BUILD_TARGET=prod \
        docker compose up {{ args }}

# Stop production stack
down-prod:
    @echo "Stopping production stack..."
    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-prod \
        docker compose down --remove-orphans

# Rebuild and restart production stack
rebuild-prod:
    @echo "Rebuilding production stack..."
    @just down-prod
    @just build-prod
    @just up-prod

# Build development images
build-dev:
    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-dev \
        PANCOLLE_BUILD_TARGET=dev \
        docker compose build --no-cache

# Build production images
build-prod:
    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-prod \
        PANCOLLE_BUILD_TARGET=prod \
        docker compose build --no-cache

# ==============================================================================
# Prisma / Database
# ==============================================================================

# Run Prisma migrate dev with optional arguments
db-migrate *args:
    pnpm exec tsx scripts/db.ts migrate {{ args }}

db-seed:
    pnpm exec tsx scripts/db.ts seed

# Reset the database (caution: deletes all data)
db-reset *args:
    pnpm exec tsx scripts/db.ts reset {{ args }}

# Open Prisma Studio to browse/edit data
db-studio:
    pnpm exec tsx scripts/db.ts studio

# ==============================================================================
# Testing
# ==============================================================================

# Run test suite
test:
    pnpm test

# Run Playwright system tests
system-test:
    pnpm test:system

# Generate coverage report
coverage:
    rm -rf coverage
    pnpm test:coverage

# ==============================================================================
# Cleanup
# ==============================================================================

# Remove repository-local generated artifacts
clean:
    rm -rf \
        .next \
        coverage \
        node_modules

# Start VitePress documentation dev server
docs:
    pnpm docs:dev

# Build VitePress documentation
docs-build:
    pnpm docs:build

# Preview VitePress documentation
docs-preview:
    pnpm docs:preview
