import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { PrismaLibSql } from '@prisma/adapter-libsql';
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
      log: ['error'],
      adapter: new PrismaLibSql({
        url: databaseUrl,
        authToken: process.env.TURSO_AUTH_TOKEN || undefined,
      }),
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
    const expectedProducts = catalogFixture.products.toSorted((left, right) =>
      left.name.localeCompare(right.name, 'ja'),
    );
    const actualProducts = products
      .map((product) => ({
        name: product.name,
        category: product.category,
      }))
      .toSorted((left, right) => left.name.localeCompare(right.name, 'ja'));

    expect(actualProducts).toEqual(expectedProducts);

    const batches = await prisma.uploadBatch.findMany({
      include: {
        lines: true,
      },
    });
    expect(batches).toHaveLength(receivingHistoryFixture.batches.length);
    expect(
      batches.every((batch) => batch.processingStatus === 'PROCESSED'),
    ).toBe(true);

    const publications = await prisma.inventoryPublication.findMany({
      orderBy: { publishedAt: 'asc' },
      include: {
        uploadBatch: true,
        inventoryStatusChanges: true,
      },
    });
    expect(publications).toHaveLength(receivingHistoryFixture.batches.length);

    const currentPublication = publications.at(-1);
    if (!currentPublication) {
      throw new Error('Expected one current inventory publication.');
    }

    const expectedCurrentBatch = receivingHistoryFixture.batches.reduce(
      (latest, entry) =>
        latest && latest.publishedMinutesAgo < entry.publishedMinutesAgo
          ? latest
          : entry,
    );

    expect(currentPublication.uploadBatch.originalFileName).toBe(
      expectedCurrentBatch.originalFileName,
    );
    expect(currentPublication.uploadBatchId).toEqual(expect.any(String));
    expect(currentPublication.inventoryStatusChanges.length).toBeGreaterThan(0);
  });
});
