set shell := ["bash", "-eu", "-o", "pipefail", "-c"]
set dotenv-load

default: help

# List available recipes
help:
	@echo "Usage: just [recipe]"
	@echo ""
	@echo "Docker tasks for pancolle:"
	@just --list | tail -n +2 | awk '{printf "  \033[36m%-20s\033[0m %s\n", $1, substr($0, index($0, $2))}'

import "docker/tasks.just"
