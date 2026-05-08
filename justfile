set shell := ["bash", "-eu", "-o", "pipefail", "-c"]
set dotenv-load

APP_NAME := env("COMPOSE_PROJECT_NAME", "pancolle")
HOST_IP := env("PANCOLLE_BIND_IP", "127.0.0.1")
DEV_PORT := env("PANCOLLE_PORT", "3000")

default: help

# List available recipes
help:
    @echo "Usage: just [recipe]"
    @echo ""
    @echo "Development tasks for pancolle:"
    @just --list | tail -n +2 | awk '{printf "  \033[36m%-20s\033[0m %s\n", $1, substr($0, index($0, $2))}'

# Start development server
dev:
    npm run dev

# Build the application
build:
    npm run build

# ==============================================================================
# Code Quality
# ==============================================================================

# Apply formatter and safe lint fixes
fix:
    npm run format
    npm run lint:fix

# Run formatting checks, lint, and typecheck
check:
    npm run format:check
    npm run lint
    npm run typecheck
# ==============================================================================
# Docker Environment Commands
# ==============================================================================

# Start development stack
up *args:
    @echo "Starting development stack..."
    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-dev \
        PANCOLLE_BUILD_TARGET=dev \
        PANCOLLE_DATABASE_URL=${PANCOLLE_DATABASE_URL:-file:/data/dev.db} \
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

# Prisma / DB operations
db-setup:
    npx prisma generate
    npx prisma migrate dev --name init
    npx prisma db seed

# Run Prisma migrate dev with optional arguments
db-migrate *args:
    npx prisma migrate dev {{ args }}

# Reset the database (caution: deletes all data)
db-reset:
    npx prisma migrate reset --force

# Open Prisma Studio to browse/edit data
db-studio:
    npx prisma studio

# ==============================================================================
# Testing
# ==============================================================================

# Run test suite
test:
    npm run test

# Generate coverage report
coverage:
    rm -rf coverage
    npm run test:coverage

# ==============================================================================
# Cleanup
# ==============================================================================

# Remove repository-local generated artifacts
clean:
    rm -rf \
        .next \
        coverage \
        node_modules
