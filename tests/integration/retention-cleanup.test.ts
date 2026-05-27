import { execFileSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const { testPrisma, databaseUrl, testDir } = vi.hoisted(() => {
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
    databaseUrl,
    testDir,
  };
});

vi.mock('@/lib/prisma', () => ({
  prisma: testPrisma,
}));

import { runRetentionCleanup } from '@/features/retention/cleanup';

describe('保持期限クリーンアップの統合テスト', () => {
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

  it('30日超の削除済みデータと古い履歴を削除し、参照整合性を維持すること', async () => {
    const deletedTime = new Date('2020-01-01T00:00:00.000Z');
    const recentDeletedTime = new Date();
    const oldStatusChangedAt = new Date('2020-01-01T00:00:00.000Z');
    const recentStatusChangedAt = new Date();

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
    const recentDeletedUser = await testPrisma.user.create({
      data: {
        name: '削除直後ユーザー',
        email: 'recent-deleted@example.com',
        deletedAt: recentDeletedTime,
      },
    });

    await testPrisma.uploadBatch.create({
      data: {
        fridgeId: fridgeTarget.id,
        uploadedByUserId: userActive.id,
        originalFileName: 'receipt.png',
      },
    });

    const uploadBatchTarget = await testPrisma.uploadBatch.create({
      data: {
        fridgeId: fridgeActive.id,
        uploadedByUserId: userActive.id,
        originalFileName: 'old-deleted-receipt.png',
        deletedAt: deletedTime,
      },
    });

    const uploadBatchLine = await testPrisma.uploadBatchLine.create({
      data: {
        uploadBatchId: uploadBatchTarget.id,
        lineNumber: 1,
        rawText: 'milk 1',
        count: 1,
        matchStatus: 'UNMATCHED',
      },
    });

    const batchByUser = await testPrisma.uploadBatch.create({
      data: {
        fridgeId: fridgeActive.id,
        uploadedByUserId: userTarget.id,
        originalFileName: 'user_history.png',
      },
    });

    await testPrisma.currentInventory.create({
      data: {
        fridgeId: fridgeActive.id,
        productId: (
          await testPrisma.product.create({
            data: { name: '統合テスト商品', category: 'BREAD' },
          })
        ).id,
        count: 1,
        status: 'FEW_LEFT',
        isVisible: true,
        lastPublishedAt: new Date(),
        lastChangedAt: new Date(),
        lastChangedByUserId: userTarget.id,
      },
    });

    const oldStatusChange = await testPrisma.inventoryStatusChange.create({
      data: {
        fridgeId: fridgeActive.id,
        productId: (await testPrisma.product.findFirstOrThrow()).id,
        changedByUserId: userActive.id,
        previousStatus: 'PLENTIFUL',
        nextStatus: 'FEW_LEFT',
        changedAt: oldStatusChangedAt,
      },
    });
    const recentStatusChange = await testPrisma.inventoryStatusChange.create({
      data: {
        fridgeId: fridgeActive.id,
        productId: (await testPrisma.product.findFirstOrThrow()).id,
        changedByUserId: userActive.id,
        previousStatus: 'FEW_LEFT',
        nextStatus: 'SOLD_OUT',
        changedAt: recentStatusChangedAt,
      },
    });

    const result = await runRetentionCleanup();

    expect(result.deletedFridges).toBeGreaterThanOrEqual(1);
    expect(result.deletedUsers).toBeGreaterThanOrEqual(1);
    expect(result.deletedStatusChanges).toBeGreaterThanOrEqual(1);
    expect(result.deletedUploadBatches).toBeGreaterThanOrEqual(1);

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
    expect(userIds).toContain(recentDeletedUser.id);

    const placeholderUser = await testPrisma.user.findUnique({
      where: { email: 'deleted-user@pan-for-play.local' },
    });
    expect(placeholderUser).not.toBeNull();

    const updatedBatch = await testPrisma.uploadBatch.findUnique({
      where: { id: batchByUser.id },
    });
    expect(updatedBatch?.uploadedByUserId).toBe(placeholderUser?.id);

    await expect(
      testPrisma.uploadBatch.findUnique({
        where: { id: uploadBatchTarget.id },
      }),
    ).resolves.toBeNull();
    await expect(
      testPrisma.uploadBatchLine.findUnique({
        where: { id: uploadBatchLine.id },
      }),
    ).resolves.toBeNull();

    const updatedInventory = await testPrisma.currentInventory.findFirst({
      where: {
        fridgeId: fridgeActive.id,
      },
    });
    expect(updatedInventory?.lastChangedByUserId).toBe(placeholderUser?.id);

    await expect(
      testPrisma.inventoryStatusChange.findUnique({
        where: { id: oldStatusChange.id },
      }),
    ).resolves.toBeNull();
    await expect(
      testPrisma.inventoryStatusChange.findUnique({
        where: { id: recentStatusChange.id },
      }),
    ).resolves.not.toBeNull();
  });
});
