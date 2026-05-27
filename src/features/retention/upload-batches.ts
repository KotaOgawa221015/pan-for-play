import type { Prisma } from '@prisma/client';

export async function deleteExpiredUploadBatches(input: {
  tx: Prisma.TransactionClient;
  cutoff: Date;
  batchLimit: number;
}) {
  const targetBatches = await input.tx.uploadBatch.findMany({
    where: {
      deletedAt: { lte: input.cutoff },
    },
    orderBy: [{ deletedAt: 'asc' }, { id: 'asc' }],
    take: input.batchLimit,
    select: { id: true },
  });

  if (targetBatches.length === 0) {
    return 0;
  }

  const batchIds = targetBatches.map((batch) => batch.id);

  await input.tx.uploadBatchLine.deleteMany({
    where: { uploadBatchId: { in: batchIds } },
  });

  const deletedBatches = await input.tx.uploadBatch.deleteMany({
    where: { id: { in: batchIds } },
  });

  return deletedBatches.count;
}
