import { prisma } from '@/lib/prisma';

export async function storeReviewBatchImagePath(
  batchId: string,
  storagePath: string,
) {
  await prisma.uploadBatch.update({
    where: { id: batchId },
    data: {
      storagePath,
    },
  });
}
