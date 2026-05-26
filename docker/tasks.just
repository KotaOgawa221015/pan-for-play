APP_NAME := env("COMPOSE_PROJECT_NAME", "pan-for-play")

# Start development stack
up *args:
    @echo "Starting development stack..."
    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-dev \
        P4P_BUILD_TARGET=dev \
        docker compose -f docker/compose.yaml up {{ args }}

# Stop development stack
down:
    @echo "Stopping development stack..."
    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-dev \
        docker compose -f docker/compose.yaml down --remove-orphans

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
        P4P_BUILD_TARGET=prod \
        docker compose -f docker/compose.yaml up {{ args }}

# Stop production stack
down-prod:
    @echo "Stopping production stack..."
    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-prod \
        docker compose -f docker/compose.yaml down --remove-orphans

# Rebuild and restart production stack
rebuild-prod:
    @echo "Rebuilding production stack..."
    @just down-prod
    @just build-prod
    @just up-prod

# Build development images
build-dev:
    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-dev \
        P4P_BUILD_TARGET=dev \
        docker compose -f docker/compose.yaml build --no-cache

# Build production images
build-prod:
    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-prod \
        P4P_BUILD_TARGET=prod \
        docker compose -f docker/compose.yaml build --no-cache
