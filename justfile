set shell := ["bash", "-eu", "-o", "pipefail", "-c"]
set dotenv-load

default: help

# List available recipes
help:
	@echo "Usage: just [recipe]"
	@echo ""
	@echo "Docker tasks for Pan for Play:"
	@just --list | tail -n +2 | awk '{printf "  \033[36m%-20s\033[0m %s\n", $1, substr($0, index($0, $2))}'

# Check Turso connection and tables
turso-check:
	pnpm exec tsx scripts/turbo-health.ts

# Apply pending migrations to Turso
turso-migrate:
	pnpm exec tsx scripts/turso-migrate.ts

# Recreate Turso DB (destructive)
turso-reset:
	pnpm exec tsx scripts/turso-recreate.ts --force

# Build bundled OCR worker and wasm files
ocr-build:
	pnpm exec tsx scripts/build-ocr-worker.ts

# Run Vercel-equivalent build locally
deploy-build:
	pnpm run vercel-build

# Setup local SQLite database
local-setup:
	pnpm exec tsx scripts/db.ts setup

# Create/apply local SQLite migration
local-migrate:
	pnpm exec tsx scripts/db.ts migrate

# Seed local SQLite database
local-seed:
	pnpm exec tsx scripts/db.ts seed

# Reset local SQLite database
local-reset:
	pnpm exec tsx scripts/db.ts reset

# Open Prisma Studio for local SQLite
local-studio:
	pnpm exec tsx scripts/db.ts studio

import "docker/tasks.just"
