import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const rootDir = path.resolve(__dirname, '..', '..');
const tmpDir = path.join(rootDir, '.tmp');
const prismaBinary =
  process.platform === 'win32'
    ? path.join(rootDir, 'node_modules', '.bin', 'prisma.cmd')
    : path.join(rootDir, 'node_modules', '.bin', 'prisma');

let databaseUrl: string;

function commandEnv() {
  if (!databaseUrl) {
    throw new Error(
      'Test database URL must be initialized before command run.',
    );
  }

  return { ...process.env, DATABASE_URL: databaseUrl };
}

function runPrisma(args: string[]) {
  execFileSync(prismaBinary, args, {
    cwd: rootDir,
    env: commandEnv(),
    stdio: 'pipe',
  });
}

function runNode(args: string[]) {
  execFileSync(process.execPath, args, {
    cwd: rootDir,
    env: commandEnv(),
    stdio: 'pipe',
  });
}

describe('seed script', () => {
  let prisma: PrismaClient;
  let testDir: string;

  beforeAll(async () => {
    mkdirSync(tmpDir, { recursive: true });
    testDir = mkdtempSync(path.join(tmpDir, 'seed-script-'));
    databaseUrl = `file:${path.join(testDir, 'seed.db')}`;

    runPrisma(['migrate', 'deploy']);
    runNode(['prisma/seed.js']);

    prisma = new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }

    if (testDir) {
      await rm(testDir, { force: true, recursive: true });
    }
  });

  it('loads inventory and upload seed data', async () => {
    const users = await prisma.user.findMany();
    expect(users).toHaveLength(2);
    expect(users.some((user) => user.role === 'ADMIN')).toBe(true);

    const products = await prisma.product.findMany();
    expect(products.length).toBeGreaterThan(0);

    const checks = await prisma.inventoryCheck.findMany();
    expect(checks.length).toBeGreaterThanOrEqual(products.length);

    const uploadBatch = await prisma.uploadBatch.findFirst();
    expect(uploadBatch).not.toBeNull();

    if (!uploadBatch) {
      throw new Error('Expected an upload batch to exist after seeding.');
    }

    const uploadLines = await prisma.uploadBatchLine.findMany({
      where: { uploadBatchId: uploadBatch.id },
    });
    expect(uploadLines.length).toBeGreaterThan(0);
  });
});
