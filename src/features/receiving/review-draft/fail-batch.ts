import { prisma } from '@/lib/prisma';

export async function failReviewBatch(batchId: string) {
  await prisma.uploadBatch.update({
    where: { id: batchId },
    data: {
      processingStatus: 'FAILED',
    },
  });
}
