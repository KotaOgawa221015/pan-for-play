import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import catalogFixture from '../../prisma/fixtures/catalog-products.json';
import receivingHistoryFixture from '../../prisma/fixtures/receiving-history.json';

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

  it('loads product and receiving seed data from the fixtures', async () => {
    const users = await prisma.user.findMany();
    expect(users).toHaveLength(2);
    expect(users.some((user) => user.role === 'ADMIN')).toBe(true);

    const products = await prisma.product.findMany();
    expect(products.map((product) => product.name).toSorted()).toEqual(
      catalogFixture.products.toSorted(),
    );

    const batches = await prisma.uploadBatch.findMany({
      include: {
        lines: true,
      },
    });
    expect(batches).toHaveLength(receivingHistoryFixture.batches.length);
    expect(
      batches.filter((batch) => batch.processingStatus === 'APPLIED'),
    ).toHaveLength(1);
    expect(
      batches.filter((batch) => batch.processingStatus === 'REVERTED'),
    ).toHaveLength(1);

    const currentBatch = batches.find(
      (batch) => batch.processingStatus === 'APPLIED',
    );
    if (!currentBatch) {
      throw new Error('Expected one current receiving batch.');
    }

    expect(currentBatch.lines.length).toBe(
      receivingHistoryFixture.batches.find(
        (history) => history.processingStatus === 'APPLIED',
      )?.products.length,
    );
  });
});
