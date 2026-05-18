import { spawnSync } from 'node:child_process';
import { applyPendingMigrations, createTursoClient } from './turso-database.ts';

const loadEnvFile = (
  process as typeof process & {
    loadEnvFile?: () => void;
  }
).loadEnvFile;

loadEnvFile?.();

type RunCommandOptions = {
  captureStdout?: boolean;
};

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  return databaseUrl;
}

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function hasForceFlag(): boolean {
  return process.argv.slice(2).some((arg) => {
    return arg === '--force' || arg === '--force=1' || arg === 'force=1';
  });
}

function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): string {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: options.captureStdout ? 'utf8' : undefined,
    stdio: options.captureStdout ? ['inherit', 'pipe', 'inherit'] : 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed.`);
  }

  return result.stdout ? String(result.stdout).trim() : '';
}

function runPnpm(args: string[]): void {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  runCommand(command, args);
}

function runTurso(args: string[], options?: RunCommandOptions): string {
  const command = process.platform === 'win32' ? 'turso.cmd' : 'turso';
  return runCommand(command, args, options);
}

function recreateDatabase(databaseName: string): void {
  const createArgs = ['db', 'create', databaseName, '--wait'];

  if (process.env.TURSO_DATABASE_GROUP) {
    createArgs.push('--group', process.env.TURSO_DATABASE_GROUP);
  }

  runTurso(['db', 'destroy', databaseName, '--yes']);
  runTurso(createArgs);
}

function createDatabaseToken(databaseName: string): string {
  const expiration = requireEnv('TURSO_AUTH_TOKEN_EXPIRATION');

  return runTurso(
    ['db', 'tokens', 'create', databaseName, '--expiration', expiration],
    { captureStdout: true },
  );
}

async function migrateAndSeed(authToken: string): Promise<void> {
  process.env.TURSO_AUTH_TOKEN = authToken;

  const client = createTursoClient();
  try {
    await applyPendingMigrations(client);
  } finally {
    client.close();
  }

  runPnpm(['db:seed']);
}

async function main(): Promise<void> {
  if (!hasForceFlag()) {
    throw new Error(
      'Turso database recreation is destructive. Re-run with --force.',
    );
  }

  getDatabaseUrl();
  const databaseName = requireEnv('TURSO_DATABASE_NAME');

  recreateDatabase(databaseName);
  const authToken = createDatabaseToken(databaseName);

  if (!authToken) {
    throw new Error('Failed to create a Turso database token.');
  }

  await migrateAndSeed(authToken);

  console.log(
    'Turso database recreated. Update TURSO_AUTH_TOKEN in runtime secrets.',
  );
  console.log(authToken);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
