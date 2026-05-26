import { execFileSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const { testPrisma, authMock, databaseUrl, testDir } = vi.hoisted(() => {
  const _path = require('node:path');
  const _fs = require('node:fs');

  const rootDir = _path.resolve(__dirname, '..', '..');
  const tmpDir = _path.join(rootDir, '.tmp');
  _fs.mkdirSync(tmpDir, { recursive: true });

  const testDir = _fs.mkdtempSync(_path.join(tmpDir, 'cleanup-action-test-'));
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

  it('管理者画面からクリーンアップを実行した際、論理削除された冷蔵庫とユーザーデータが安全に処理されること', async () => {
    authMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });

    const deletedTime = new Date();

    const fridgeTarget = await testPrisma.fridge.create({
      data: { name: '削除対象冷蔵庫', deletedAt: deletedTime },
    });
    const fridgeActive = await testPrisma.fridge.create({
      data: { name: '稼働中冷蔵庫', deletedAt: null },
    });

    const userTarget = await testPrisma.user.create({
      data: {
        name: '退会対象ユーザー',
        email: 'target@example.com',
        deletedAt: deletedTime,
      },
    });
    const userActive = await testPrisma.user.create({
      data: {
        name: '現役ユーザー',
        email: 'active@example.com',
        deletedAt: null,
      },
    });

    await testPrisma.uploadBatch.create({
      data: {
        fridgeId: fridgeTarget.id,
        uploadedByUserId: userActive.id,
        originalFileName: 'receipt.png',
      },
    });

    const batchByUser = await testPrisma.uploadBatch.create({
      data: {
        fridgeId: fridgeActive.id,
        uploadedByUserId: userTarget.id,
        originalFileName: 'user_history.png',
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
    expect(fridgeIds).toContain(fridgeActive.id);

    const remainingUsers = (await testPrisma.user.findMany({
      select: { id: true },
    })) as { id: string }[];
    const userIds = remainingUsers.map((u) => u.id);
    expect(userIds).not.toContain(userTarget.id);
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
