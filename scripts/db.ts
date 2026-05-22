import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { requireDatabaseUrl } from '../src/lib/environment.ts';

function readDatabaseUrlFromEnvFile(): string | null {
  const envFilePath = path.resolve(process.cwd(), '.env');

  if (!fs.existsSync(envFilePath)) {
    return null;
  }

  const envFileContent = fs.readFileSync(envFilePath, 'utf8');
  const match = envFileContent.match(/^DATABASE_URL=(.*)$/m);

  if (!match) {
    return null;
  }

  return match[1].trim().replace(/^"(.*)"$/, '$1');
}

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL ?? readDatabaseUrlFromEnvFile();

  return requireDatabaseUrl({
    ...process.env,
    DATABASE_URL: databaseUrl ?? undefined,
  });
}

function isLocalDatabaseUrl(databaseUrl: string): boolean {
  return databaseUrl.startsWith('file:') || databaseUrl.startsWith('sqlite:');
}

function getDatabaseKind(): 'local' | 'turso' {
  return isLocalDatabaseUrl(getDatabaseUrl()) ? 'local' : 'turso';
}

function assertLocalDatabase(commandName: string): void {
  if (getDatabaseKind() !== 'local') {
    throw new Error(`${commandName} targets local SQLite only.`);
  }
}

function ensureLocalDataDir(): void {
  fs.mkdirSync(path.resolve(process.cwd(), 'data'), { recursive: true });
}

function getLocalDatabaseFiles(): string[] {
  const databaseUrl = getDatabaseUrl();

  if (!isLocalDatabaseUrl(databaseUrl)) {
    throw new Error('Local database files are available for SQLite only.');
  }

  const dbPath = databaseUrl.replace(/^(file:|sqlite:)/, '');
  const cleanPath = dbPath.split('?')[0].split('#')[0];
  const absolutePath = path.resolve(process.cwd(), cleanPath);

  return [absolutePath, `${absolutePath}-wal`, `${absolutePath}-shm`];
}

function removeLocalDatabaseFiles(): void {
  for (const filePath of getLocalDatabaseFiles()) {
    fs.rmSync(filePath, { force: true });
  }
}

function runCommand(command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

function runPnpm(args: string[]): void {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  runCommand(command, args);
}

function parseForce(args: string[]): boolean {
  for (const arg of args) {
    if (arg === '--force' || arg === 'force=1' || arg === '--force=1') {
      return true;
    }
  }

  return false;
}

function assertNoArgs(commandName: string, args: string[]): void {
  if (args.length > 0) {
    throw new Error(`${commandName} does not accept extra arguments.`);
  }
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  if (!command) {
    throw new Error(
      'Usage: tsx scripts/db.ts <setup|migrate|seed|reset|studio>',
    );
  }

  switch (command) {
    case 'setup': {
      assertNoArgs('setup', args);
      assertLocalDatabase('setup');
      ensureLocalDataDir();
      runPnpm(['db:setup']);
      return;
    }

    case 'migrate': {
      assertLocalDatabase('db-migrate');
      ensureLocalDataDir();
      runPnpm(['db:migrate', ...args]);
      return;
    }

    case 'seed': {
      assertNoArgs('seed', args);
      assertLocalDatabase('db-seed');
      ensureLocalDataDir();
      runPnpm(['db:seed']);
      return;
    }

    case 'reset': {
      const force = parseForce(args);
      assertLocalDatabase('db-reset');

      if (force) {
        console.log('force is ignored for local SQLite reset.');
      }

      removeLocalDatabaseFiles();
      runPnpm(['db:reset']);
      return;
    }

    case 'studio': {
      assertNoArgs('studio', args);
      assertLocalDatabase('db-studio');
      ensureLocalDataDir();
      runPnpm(['exec', 'prisma', 'studio']);
      return;
    }

    default:
      throw new Error(`Unknown database command: ${command}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
