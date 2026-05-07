set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

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

# Install repository dependencies from the lockfile
setup:
    npm ci

# Apply formatter and safe lint fixes
fix:
    npm run format
    npm run lint:fix

# Run formatting checks, lint, and typecheck
check:
    npm run format:check
    npm run lint
    npm run typecheck

# Prisma / DB operations
db-generate:
    npx prisma generate

db-migrate name="init":
    npx prisma migrate dev --name {{ name }}

db-deploy:
    npx prisma migrate deploy

db-push:
    npx prisma db push

db-seed:
    npx prisma db seed

db-studio:
    npx prisma studio

db-reset:
    npx prisma migrate reset --force

# Run test suite
test:
    npm run test

# Generate coverage report
coverage:
    rm -rf coverage
    npm run test:coverage

# Remove repository-local generated artifacts
clean:
    rm -rf \
        .next \
        coverage \
        node_modules
