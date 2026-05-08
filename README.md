# Pancolle

Pancolle is a simple inventory status board for frozen bread and soup. Each item has three status levels: plentiful, few left, and sold out. Users can update status with a single tap and the change is shared immediately.

## Requirements

- Node.js 24.x
- SQLite (via Prisma driver adapter)

## Setup

1. Install dependencies.

```bash
npm install
```

2. Create a local environment file.

```bash
cp .env.example .env
```

This project uses DATABASE_URL on the server side (Prisma). In production, set DATABASE_URL via your hosting platform or Docker environment variables instead of committing a .env file.

3. Create the database and seed data.

```bash
just db-setup
```

4. Start the development server.

```bash
just dev
```

Open http://localhost:3000.

## Common commands

- just dev
- just fix
- just check
- just test

## Prisma and database

The project uses Prisma 7 with the better-sqlite3 driver adapter. The local database file is created at ./dev.db.

- just db-setup
- just db-migrate name=init
- just db-reset
- just db-studio

## Docker

The compose setup runs a one-shot db-init service (Prisma generate, migrate, seed) and then starts the Next.js server.

```bash
PANCOLLE_BUILD_TARGET=prod docker compose up --build
```

For development, use the development build target and dev migration mode.

```bash
just up
```

For a production-like stack with prod.db defaults:

```bash
just up-prod
```

The SQLite database is stored in a named Docker volume at /data/prod.db inside the containers.
You can override the database location by setting PANCOLLE_DATABASE_URL.

```bash
PANCOLLE_BUILD_TARGET=prod PANCOLLE_DATABASE_URL="file:/data/prod.db" docker compose up --build
```

To run a separate staging instance side-by-side, change the project name and database path.

```bash
PANCOLLE_BUILD_TARGET=prod PANCOLLE_PROJECT_NAME=pancolle-staging PANCOLLE_DATABASE_URL="file:/data/staging.db" docker compose up --build
```
