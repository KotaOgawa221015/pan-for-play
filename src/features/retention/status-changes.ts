import type { Prisma } from '@prisma/client';

export async function deleteExpiredStatusChanges(input: {
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
