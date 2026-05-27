import type { Prisma } from '@prisma/client';

const DELETED_USER_PLACEHOLDER_EMAIL = 'deleted-user@pan-for-play.local';
const DELETED_USER_PLACEHOLDER_ID = 'deleted-user-placeholder';
const DELETED_USER_PLACEHOLDER_NAME = '削除済みユーザー';

export async function deleteExpiredUsers(input: {
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
