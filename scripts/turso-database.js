const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@libsql/client');

const projectRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(projectRoot, 'prisma', 'migrations');
const migrationsTableName = '__pancolle_migrations';

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  return databaseUrl;
}

function assertTursoDatabaseUrl() {
  const databaseUrl = getDatabaseUrl();

  if (databaseUrl.startsWith('file:') || databaseUrl.startsWith('sqlite:')) {
    throw new Error(
      'This command targets Turso only. Use the local db-* recipes for SQLite.',
    );
  }

  return databaseUrl;
}

function getTursoAuthToken() {
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!authToken) {
    throw new Error('TURSO_AUTH_TOKEN is required for Turso commands.');
  }

  return authToken;
}

function createTursoClient() {
  return createClient({
    url: assertTursoDatabaseUrl(),
    authToken: getTursoAuthToken(),
  });
}

function listMigrationEntries() {
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const filePath = path.join(migrationsDir, entry.name, 'migration.sql');

      if (!fs.existsSync(filePath)) {
        throw new Error(`Migration file is missing: ${filePath}`);
      }

      const sql = fs.readFileSync(filePath, 'utf8');

      return {
        name: entry.name,
        filePath,
        sql,
        checksum: crypto.createHash('sha256').update(sql).digest('hex'),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function ensureMigrationsTable(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "${migrationsTableName}" (
      "name" TEXT NOT NULL PRIMARY KEY,
      "checksum" TEXT NOT NULL,
      "appliedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function listAppliedMigrations(client) {
  await ensureMigrationsTable(client);

  const result = await client.execute(
    `SELECT "name", "checksum" FROM "${migrationsTableName}" ORDER BY "name" ASC`,
  );

  return new Map(
    result.rows.map((row) => [String(row.name), String(row.checksum)]),
  );
}

async function listUserTables(client) {
  const result = await client.execute(`
    SELECT "name"
    FROM "sqlite_master"
    WHERE "type" = 'table'
      AND "name" NOT LIKE 'sqlite_%'
    ORDER BY "name" ASC
  `);

  return result.rows.map((row) => String(row.name));
}

async function applyPendingMigrations(client) {
  const migrationEntries = listMigrationEntries();
  const appliedMigrations = await listAppliedMigrations(client);
  const userTables = await listUserTables(client);

  if (appliedMigrations.size === 0 && userTables.length > 1) {
    throw new Error(
      `Remote database already has tables but no ${migrationsTableName} records. Recreate the Turso database or baseline manually.`,
    );
  }

  for (const entry of migrationEntries) {
    const appliedChecksum = appliedMigrations.get(entry.name);

    if (appliedChecksum) {
      if (appliedChecksum !== entry.checksum) {
        throw new Error(
          `Migration checksum mismatch for ${entry.name}. Refusing to continue.`,
        );
      }

      console.log(`skip ${entry.name}`);
      continue;
    }

    console.log(`apply ${entry.name}`);
    await client.executeMultiple(entry.sql);
    await client.execute({
      sql: `INSERT INTO "${migrationsTableName}" ("name", "checksum") VALUES (?, ?)`,
      args: [entry.name, entry.checksum],
    });
  }
}

module.exports = {
  applyPendingMigrations,
  assertTursoDatabaseUrl,
  createTursoClient,
  getTursoAuthToken,
};
