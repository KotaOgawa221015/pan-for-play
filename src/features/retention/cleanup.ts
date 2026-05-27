import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const DELETED_USER_PLACEHOLDER_EMAIL = 'deleted-user@pan-for-play.local';
const DELETED_USER_PLACEHOLDER_ID = 'deleted-user-placeholder';
const DELETED_USER_PLACEHOLDER_NAME = '削除済みユーザー';

const RETENTION_DAYS = 30;
const BATCH_LIMIT = 200;

export type CleanupResult = {
  cutoff: string;
  deletedStatusChanges: number;
  deletedFridges: number;
  deletedUsers: number;
};

function resolveCutoff(inputNow: Date) {
  return new Date(inputNow.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

async function deleteExpiredStatusChanges(input: {
  tx: Prisma.TransactionClient;
  cutoff: Date;
  batchLimit: number;
}) {
  const targetStatusChanges = await input.tx.inventoryStatusChange.findMany({
    where: {
      changedAt: { lte: input.cutoff },
    },
    orderBy: [{ changedAt: 'asc' }, { id: 'asc' }],
    take: input.batchLimit,
    select: { id: true },
  });

  if (targetStatusChanges.length === 0) {
    return 0;
  }

  const deletedStatusChanges = await input.tx.inventoryStatusChange.deleteMany({
    where: {
      id: {
        in: targetStatusChanges.map((statusChange) => statusChange.id),
      },
    },
  });

  return deletedStatusChanges.count;
}

async function deleteExpiredFridges(input: {
  tx: Prisma.TransactionClient;
  cutoff: Date;
  batchLimit: number;
}) {
  const targetFridges = await input.tx.fridge.findMany({
    where: {
      deletedAt: { lte: input.cutoff },
    },
    orderBy: [{ deletedAt: 'asc' }, { id: 'asc' }],
    take: input.batchLimit,
    select: { id: true },
  });

  if (targetFridges.length === 0) {
    return 0;
  }

  const fridgeIds = targetFridges.map((fridge) => fridge.id);

  await input.tx.user.updateMany({
    where: { favoriteFridgeId: { in: fridgeIds } },
    data: { favoriteFridgeId: null },
  });
  await input.tx.currentInventory.deleteMany({
    where: { fridgeId: { in: fridgeIds } },
  });
  await input.tx.inventoryStatusChange.deleteMany({
    where: { fridgeId: { in: fridgeIds } },
  });
  await input.tx.inventoryPublication.deleteMany({
    where: { fridgeId: { in: fridgeIds } },
  });
  await input.tx.uploadBatchLine.deleteMany({
    where: { uploadBatch: { fridgeId: { in: fridgeIds } } },
  });
  await input.tx.uploadBatch.deleteMany({
    where: { fridgeId: { in: fridgeIds } },
  });

  const deletedFridges = await input.tx.fridge.deleteMany({
    where: { id: { in: fridgeIds } },
  });

  return deletedFridges.count;
}

async function deleteExpiredUsers(input: {
  tx: Prisma.TransactionClient;
  cutoff: Date;
  batchLimit: number;
}) {
  const targetUsers = await input.tx.user.findMany({
    where: {
      deletedAt: { lte: input.cutoff },
      email: { not: DELETED_USER_PLACEHOLDER_EMAIL },
    },
    orderBy: [{ deletedAt: 'asc' }, { id: 'asc' }],
    take: input.batchLimit,
    select: { id: true },
  });

  if (targetUsers.length === 0) {
    return 0;
  }

  let placeholderUser = await input.tx.user.findUnique({
    where: { email: DELETED_USER_PLACEHOLDER_EMAIL },
    select: { id: true },
  });

  if (!placeholderUser) {
    placeholderUser = await input.tx.user.create({
      data: {
        id: DELETED_USER_PLACEHOLDER_ID,
        name: DELETED_USER_PLACEHOLDER_NAME,
        email: DELETED_USER_PLACEHOLDER_EMAIL,
        role: 'MEMBER',
      },
      select: { id: true },
    });
  }

  const userIds = targetUsers.map((user) => user.id);

  await input.tx.uploadBatch.updateMany({
    where: { uploadedByUserId: { in: userIds } },
    data: { uploadedByUserId: placeholderUser.id },
  });
  await input.tx.inventoryPublication.updateMany({
    where: { publishedByUserId: { in: userIds } },
    data: { publishedByUserId: placeholderUser.id },
  });
  await input.tx.inventoryStatusChange.updateMany({
    where: { changedByUserId: { in: userIds } },
    data: { changedByUserId: placeholderUser.id },
  });
  await input.tx.currentInventory.updateMany({
    where: { lastChangedByUserId: { in: userIds } },
    data: { lastChangedByUserId: placeholderUser.id },
  });

  await input.tx.account.deleteMany({ where: { userId: { in: userIds } } });
  await input.tx.session.deleteMany({ where: { userId: { in: userIds } } });
  const deletedUsers = await input.tx.user.deleteMany({
    where: { id: { in: userIds } },
  });

  return deletedUsers.count;
}

export async function runRetentionCleanup(): Promise<CleanupResult> {
  const cutoff = resolveCutoff(new Date());

  const result = await prisma.$transaction(async (tx) => {
    const deletedStatusChanges = await deleteExpiredStatusChanges({
      tx,
      cutoff,
      batchLimit: BATCH_LIMIT,
    });

    const deletedFridges = await deleteExpiredFridges({
      tx,
      cutoff,
      batchLimit: BATCH_LIMIT,
    });
    const deletedUsers = await deleteExpiredUsers({
      tx,
      cutoff,
      batchLimit: BATCH_LIMIT,
    });

    return {
      deletedStatusChanges,
      deletedFridges,
      deletedUsers,
    };
  });

  return {
    cutoff: cutoff.toISOString(),
    ...result,
  };
}
