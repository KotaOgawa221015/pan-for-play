import { existsSync } from 'node:fs';
import { applyPendingMigrations, createTursoClient } from './turso-database.ts';

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
    await applyPendingMigrations(client);
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
