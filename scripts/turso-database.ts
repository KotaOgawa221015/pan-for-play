import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';

type TursoClient = ReturnType<typeof createClient>;

type MigrationEntry = {
  name: string;
  filePath: string;
  sql: string;
  checksum: string;
};

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const migrationsDir = path.join(projectRoot, 'prisma', 'migrations');
const migrationsTableName = '__pancolle_migrations';

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  return databaseUrl;
}

export function assertTursoDatabaseUrl(): string {
  const databaseUrl = getDatabaseUrl();

  if (databaseUrl.startsWith('file:') || databaseUrl.startsWith('sqlite:')) {
    throw new Error(
      'This command targets Turso only. Use the local db-* recipes for SQLite.',
    );
  }

  return databaseUrl;
}

export function getTursoAuthToken(): string {
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!authToken) {
    throw new Error('TURSO_AUTH_TOKEN is required for Turso commands.');
  }

  return authToken;
}

export function createTursoClient(): TursoClient {
  return createClient({
    url: assertTursoDatabaseUrl(),
    authToken: getTursoAuthToken(),
  });
}

function listMigrationEntries(): MigrationEntry[] {
  const entries: MigrationEntry[] = [];

  for (const entry of fs.readdirSync(migrationsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const filePath = path.join(migrationsDir, entry.name, 'migration.sql');

    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration file is missing: ${filePath}`);
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    entries.push({
      name: entry.name,
      filePath,
      sql,
      checksum: crypto.createHash('sha256').update(sql).digest('hex'),
    });
  }

  return entries.sort((left, right) => left.name.localeCompare(right.name));
}

async function ensureMigrationsTable(client: TursoClient): Promise<void> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "${migrationsTableName}" (
      "name" TEXT NOT NULL PRIMARY KEY,
      "checksum" TEXT NOT NULL,
      "appliedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function listAppliedMigrations(
  client: TursoClient,
): Promise<Map<string, string>> {
  const result = await client.execute(
    `SELECT "name", "checksum" FROM "${migrationsTableName}" ORDER BY "name" ASC`,
  );

  return new Map(
    result.rows.map((row) => [String(row.name), String(row.checksum)]),
  );
}

async function listUserTables(client: TursoClient): Promise<string[]> {
  const result = await client.execute(`
    SELECT "name"
    FROM "sqlite_master"
    WHERE "type" = 'table'
      AND "name" NOT LIKE 'sqlite_%'
    ORDER BY "name" ASC
  `);

  return result.rows.map((row) => String(row.name));
}

export async function applyPendingMigrations(
  client: TursoClient,
): Promise<void> {
  const migrationEntries = listMigrationEntries();
  await ensureMigrationsTable(client);
  const [appliedMigrations, userTables] = await Promise.all([
    listAppliedMigrations(client),
    listUserTables(client),
  ]);

  if (appliedMigrations.size === 0 && userTables.length > 1) {
    throw new Error(
      `Remote database already has tables but no ${migrationsTableName} records. Recreate the Turso database or baseline manually.`,
    );
  }

  await migrationEntries.reduce(async (previous, entry) => {
    await previous;

    const appliedChecksum = appliedMigrations.get(entry.name);

    if (appliedChecksum) {
      if (appliedChecksum !== entry.checksum) {
        throw new Error(
          `Migration checksum mismatch for ${entry.name}. Refusing to continue.`,
        );
      }

      console.log(`skip ${entry.name}`);
      return;
    }

    console.log(`apply ${entry.name}`);
    await client.executeMultiple(entry.sql);
    await client.execute({
      sql: `INSERT INTO "${migrationsTableName}" ("name", "checksum") VALUES (?, ?)`,
      args: [entry.name, entry.checksum],
    });
  }, Promise.resolve());
}
