# Pancolle

Pancolle is a simple inventory status board for frozen bread and soup. Each item has three status levels: plentiful, few left, and sold out. Users can update status with a single tap and the change is shared immediately.

## Requirements

- Node.js 24.x
- SQLite (via Prisma driver adapter)

## Setup

1. Install dependencies and apply database migrations.

```bash
just setup
```

2. Start the development stack.

```bash
just up
```

Open http://localhost:3000.

## Common commands

- just setup
- just up
- just fix
- just check
- just test

## Prisma and database

The project uses Prisma 7 with the better-sqlite3 driver adapter. SQLite databases are stored under `./data` and selected by `DATABASE_URL`.
The default development value lives in `.env`, and production-like operation updates `DATABASE_URL` there or overrides it from CI/CD.

- just setup
- just db-seed
- just db-migrate name=init
- just db-reset
- just db-studio

## Docker

Database initialization is explicit. Apply migrations with `just setup`, then start the development stack.

```bash
just setup
just up
```

For a production-like stack, set `DATABASE_URL` to the production database, then run setup and startup.

```bash
DATABASE_URL="file:./data/prod.db" just setup
just up-prod
```

The same `DATABASE_URL` selects the database for Prisma commands and Docker Compose.
In CI/CD, the process environment variable `DATABASE_URL` is the source of truth and overrides values from local `.env` files.

```bash
DATABASE_URL="file:./data/prod.db" just db-seed
DATABASE_URL="file:./data/prod.db" just up-prod
```

To run a separate staging instance side-by-side, change the project name and database path.

```bash
DATABASE_URL="file:./data/staging.db" just setup
COMPOSE_PROJECT_NAME=pancolle-staging DATABASE_URL="file:./data/staging.db" just up-prod
```
