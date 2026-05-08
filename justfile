set shell := ["bash", "-eu", "-o", "pipefail", "-c"]
set dotenv-load

APP_NAME := env("PANCOLLE_PROJECT_NAME", "pancolle")
HOST_IP := env("PANCOLLE_BIND_IP", "127.0.0.1")
DEV_PORT := env("PANCOLLE_PORT", "3000")

default: help

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
# Prisma / Database
# ==============================================================================

# Prisma / DB operations
db-setup:
    npx prisma generate
    npx prisma migrate dev --name init --skip-seed
    npx prisma db seed

db-migrate name="init":
    npx prisma migrate dev --name {{ name }}

db-reset:
    npx prisma migrate reset --force

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
