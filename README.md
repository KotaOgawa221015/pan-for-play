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

- just db-generate
- just db-migrate name=init
- just db-seed
- just db-reset
- just db-studio

## Docker

The compose setup initializes the database and seeds data before starting the dev server.

```bash
docker compose up
```
