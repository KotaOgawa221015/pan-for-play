set shell := ["bash", "-eu", "-o", "pipefail", "-c"]
set dotenv-load

APP_NAME := env("COMPOSE_PROJECT_NAME", "pancolle")

default: help

# List available recipes
help:
    @echo "Usage: just [recipe]"
    @echo ""
    @echo "Docker tasks for pancolle:"
    @just --list | tail -n +2 | awk '{printf "  \033[36m%-20s\033[0m %s\n", $1, substr($0, index($0, $2))}'

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
