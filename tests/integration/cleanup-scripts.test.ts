import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const rootDir = path.resolve(__dirname, '..', '..');
const tmpDir = path.join(rootDir, '.tmp');
const prismaBinary =
  process.platform === 'win32'
    ? path.join(rootDir, 'node_modules', '.bin', 'prisma.cmd')
    : path.join(rootDir, 'node_modules', '.bin', 'prisma');

const tsxBinary =
  process.platform === 'win32'
    ? path.join(rootDir, 'node_modules', '.bin', 'tsx.cmd')
    : path.join(rootDir, 'node_modules', '.bin', 'tsx');

let databaseUrl: string;

function commandEnv() {
  if (!databaseUrl) {
    throw new Error('テストデータベースのURLが初期化されていません。');
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

function runCleanupScript(scriptName: string) {
  execFileSync(tsxBinary, [`scripts/${scriptName}`], {
    cwd: rootDir,
    env: commandEnv(),
    stdio: 'pipe',
  });
}

describe('クリーンアップスクリプトの統合テスト', () => {
  let prisma: PrismaClient;
  let testDir: string;

  beforeAll(async () => {
    mkdirSync(tmpDir, { recursive: true });
    testDir = mkdtempSync(path.join(tmpDir, 'cleanup-test-'));
    databaseUrl = `file:${path.join(testDir, 'cleanup.db')}`;

    runPrisma(['migrate', 'deploy']);

    prisma = new PrismaClient({
      log: ['error'],
      adapter: new PrismaLibSql({
        url: databaseUrl,
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

  it('削除から30日以上経った冷蔵庫とユーザーが正しく削除・クリーンアップされること', async () => {
    const now = new Date();
    const past31Days = new Date();
    past31Days.setDate(now.getDate() - 31); // 削除対象 (30日超)
    const past29Days = new Date();
    past29Days.setDate(now.getDate() - 29); // 対象外 (30日未満)

    const fridgeTarget = await prisma.fridge.create({
      data: { name: '削除対象冷蔵庫', deletedAt: past31Days },
    });
    const fridgeKeep = await prisma.fridge.create({
      data: { name: '維持対象冷蔵庫', deletedAt: past29Days },
    });
    const fridgeActive = await prisma.fridge.create({
      data: { name: '稼働中冷蔵庫', deletedAt: null },
    });

    const userTarget = await prisma.user.create({
      data: {
        name: '退会対象ユーザー',
        email: 'target@example.com',
        deletedAt: past31Days,
      },
    });
    const userKeep = await prisma.user.create({
      data: {
        name: '退会維持ユーザー',
        email: 'keep@example.com',
        deletedAt: past29Days,
      },
    });
    const userActive = await prisma.user.create({
      data: {
        name: '現役ユーザー',
        email: 'active@example.com',
        deletedAt: null,
      },
    });

    const uploadsDir = path.join(testDir, 'uploads');
    mkdirSync(uploadsDir, { recursive: true });

    const dummyFilePath = path.join(uploadsDir, 'dummy_delivery_note.png');
    writeFileSync(dummyFilePath, 'dummy data');
    expect(existsSync(dummyFilePath)).toBe(true);

    await prisma.uploadBatch.create({
      data: {
        fridgeId: fridgeTarget.id,
        uploadedByUserId: userActive.id,
        originalFileName: 'test.png',
        storagePath: dummyFilePath,
        processingStatus: 'PROCESSED',
      },
    });

    const batchByUser = await prisma.uploadBatch.create({
      data: {
        fridgeId: fridgeActive.id,
        uploadedByUserId: userTarget.id,
        originalFileName: 'user_test.png',
        processingStatus: 'PROCESSED',
      },
    });

    runCleanupScript('cleanup-deleted-fridges.ts');

    runCleanupScript('cleanup-deleted-users.ts');

    const resultFridges = await prisma.fridge.findMany({
      select: { id: true },
    });
    const fridgeIds = resultFridges.map((f) => f.id);
    expect(fridgeIds).not.toContain(fridgeTarget.id);
    expect(fridgeIds).toContain(fridgeKeep.id);
    expect(fridgeIds).toContain(fridgeActive.id);

    expect(existsSync(dummyFilePath)).toBe(false);

    const resultUsers = await prisma.user.findMany({ select: { id: true } });
    const userIds = resultUsers.map((u) => u.id);
    expect(userIds).not.toContain(userTarget.id);
    expect(userIds).toContain(userKeep.id);
    expect(userIds).toContain(userActive.id);

    const placeholderUser = await prisma.user.findUnique({
      where: { email: 'deleted-user@pancolle.local' },
    });
    expect(placeholderUser).not.toBeNull();

    const updatedBatch = await prisma.uploadBatch.findUnique({
      where: { id: batchByUser.id },
    });
    expect(updatedBatch?.uploadedByUserId).toBe(placeholderUser?.id);
  });
});
