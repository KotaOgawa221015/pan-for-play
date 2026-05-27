import type { Prisma } from '@prisma/client';

export async function deleteExpiredFridges(input: {
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
