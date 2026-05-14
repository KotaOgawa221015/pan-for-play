# Pancolle

Pancolle is a simple inventory status board for frozen bread and soup. Each product has three status levels: plentiful, few left, and sold out. Users can update status with a single tap and the change is shared immediately.

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

## Testing

Unit tests live next to the module that owns the behavior, using
`.test.ts` or `.test.tsx`. Cross-boundary tests live under `tests/`, grouped
by scope such as `tests/integration/`.

Unit tests cover focused contracts owned by a single module. Integration tests
cover observable behavior across application boundaries, with external systems
such as Next.js runtime APIs or Prisma mocked explicitly.

## Prisma and database

The `just db-*` recipes target local SQLite only.

- just setup
- just db-migrate
- just db-seed
- just db-reset
- just db-studio

Turso schema changes are explicit scripts. `scripts/turso-migrate.js` applies existing migration SQL to the configured Turso database. `scripts/turso-recreate.js --force` destroys and recreates the Turso database, applies migrations, seeds data, and prints a fresh database token for runtime secrets. `DATABASE_URL`, `TURSO_DATABASE_NAME`, and `TURSO_AUTH_TOKEN_EXPIRATION` must be present in `.env`.

```bash
node scripts/turso-migrate.js
node scripts/turso-recreate.js --force
```

## Docker

Database initialization is explicit. Apply migrations with `just setup`, then start the development stack.

```bash
just setup
just up
```

When `.env` points at Turso, override `DATABASE_URL` to use local SQLite recipes.

```bash
DATABASE_URL="file:./data/dev.db" just db-reset
DATABASE_URL="file:./data/dev.db" just db-seed
just up-prod
```

For Turso, the migration script applies the SQL files under `prisma/migrations/` in order and records applied checksums. If the remote database already has tables but no migration records, the command stops and requires database recreation or manual baseline.

The same `DATABASE_URL` selects the database for Prisma commands and Docker Compose. In CI/CD, the process environment variable `DATABASE_URL` is the source of truth and overrides values from local `.env` files.

To run a separate local SQLite instance side-by-side, change the database path.

```bash
DATABASE_URL="file:./data/staging.db" just setup
COMPOSE_PROJECT_NAME=pancolle-staging DATABASE_URL="file:./data/staging.db" just up
```
