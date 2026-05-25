import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const { testPrisma, authMock, databaseUrl, testDir } = vi.hoisted(() => {
  const _path = require('node:path');

  const rootDir = _path.resolve(__dirname, '..', '..');
  const tmpDir = _path.join(rootDir, '.tmp');
  mkdirSync(tmpDir, { recursive: true });

  const testDir = mkdtempSync(_path.join(tmpDir, 'cleanup-action-test-'));
  const databaseUrl = `file:${_path.join(testDir, 'cleanup.db')}`;

  const { PrismaClient } = require('@prisma/client');
  const { PrismaLibSql } = require('@prisma/adapter-libsql');

  const prismaInstance = new PrismaClient({
    log: ['error'],
    adapter: new PrismaLibSql({ url: databaseUrl }),
  });

  return {
    testPrisma: prismaInstance,
    authMock: vi.fn(),
    databaseUrl,
    testDir,
  };
});

vi.mock('@/lib/prisma', () => ({
  prisma: testPrisma,
}));

vi.mock('@/features/account/auth', () => ({
  auth: authMock,
}));

import {
  cleanupFridgesAction,
  cleanupUsersAction,
} from '@/features/admin/actions';

describe('データクリーンアップ Server Actions の統合テスト', () => {
  beforeAll(() => {
    const rootDir = path.resolve(__dirname, '..', '..');
    const prismaBinary =
      process.platform === 'win32'
        ? path.join(rootDir, 'node_modules', '.bin', 'prisma.cmd')
        : path.join(rootDir, 'node_modules', '.bin', 'prisma');

    execFileSync(prismaBinary, ['migrate', 'deploy'], {
      cwd: rootDir,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe',
    });
  });

  afterAll(async () => {
    if (testPrisma) {
      await testPrisma.$disconnect();
    }
    if (testDir) {
      await rm(testDir, { force: true, recursive: true });
    }
  });

  it('管理者画面からクリーンアップを実行した際、30日以上経過した冷蔵庫とユーザーデータが安全に処理されること', async () => {
    authMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });

    const now = new Date();
    const past31Days = new Date();
    past31Days.setDate(now.getDate() - 31);
    const past29Days = new Date();
    past29Days.setDate(now.getDate() - 29);

    const fridgeTarget = await testPrisma.fridge.create({
      data: { name: '削除対象冷蔵庫', deletedAt: past31Days },
    });
    const fridgeKeep = await testPrisma.fridge.create({
      data: { name: '維持対象冷蔵庫', deletedAt: past29Days },
    });
    const fridgeActive = await testPrisma.fridge.create({
      data: { name: '稼働中冷蔵庫', deletedAt: null },
    });

    const userTarget = await testPrisma.user.create({
      data: {
        name: '退会対象ユーザー',
        email: 'target@example.com',
        deletedAt: past31Days,
      },
    });
    const userKeep = await testPrisma.user.create({
      data: {
        name: '退会維持ユーザー',
        email: 'keep@example.com',
        deletedAt: past29Days,
      },
    });
    const userActive = await testPrisma.user.create({
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

    await testPrisma.uploadBatch.create({
      data: {
        fridgeId: fridgeTarget.id,
        uploadedByUserId: userActive.id,
        originalFileName: 'receipt.png',
        storagePath: dummyFilePath,
        processingStatus: 'PROCESSED',
      },
    });

    const batchByUser = await testPrisma.uploadBatch.create({
      data: {
        fridgeId: fridgeActive.id,
        uploadedByUserId: userTarget.id,
        originalFileName: 'user_history.png',
        processingStatus: 'PROCESSED',
      },
    });

    const fridgeActionResult = await cleanupFridgesAction();
    expect(fridgeActionResult.success).toBe(true);

    const userActionResult = await cleanupUsersAction();
    expect(userActionResult.success).toBe(true);

    const remainingFridges = (await testPrisma.fridge.findMany({
      select: { id: true },
    })) as { id: string }[];
    const fridgeIds = remainingFridges.map((f) => f.id);
    expect(fridgeIds).not.toContain(fridgeTarget.id);
    expect(fridgeIds).toContain(fridgeKeep.id);
    expect(fridgeIds).toContain(fridgeActive.id);

    expect(existsSync(dummyFilePath)).toBe(false);

    const remainingUsers = (await testPrisma.user.findMany({
      select: { id: true },
    })) as { id: string }[];
    const userIds = remainingUsers.map((u) => u.id);
    expect(userIds).not.toContain(userTarget.id);
    expect(userIds).toContain(userKeep.id);
    expect(userIds).toContain(userActive.id);

    const placeholderUser = await testPrisma.user.findUnique({
      where: { email: 'deleted-user@pancolle.local' },
    });
    expect(placeholderUser).not.toBeNull();

    const updatedBatch = await testPrisma.uploadBatch.findUnique({
      where: { id: batchByUser.id },
    });
    expect(updatedBatch?.uploadedByUserId).toBe(placeholderUser?.id);
  });
});
