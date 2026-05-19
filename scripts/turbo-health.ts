import { existsSync } from 'node:fs';
import { createTursoClient } from './turso-database.ts';

const loadEnvFile = (
  process as typeof process & {
    loadEnvFile?: () => void;
  }
).loadEnvFile;

if (existsSync('.env')) {
  loadEnvFile?.();
}
async function main(): Promise<void> {
  const client = createTursoClient();

  try {
    await client.execute('SELECT 1 AS ok');
    const tableResult = await client.execute(`
      SELECT "name"
      FROM "sqlite_master"
      WHERE "type" = 'table'
        AND "name" NOT LIKE 'sqlite_%'
      ORDER BY "name" ASC
    `);

    const tableNames = tableResult.rows.map((row) => String(row.name));

    console.log('Turso health check passed.');
    console.log(`tables: ${tableNames.length}`);

    if (tableNames.length > 0) {
      console.log(tableNames.join('\n'));
    }
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
