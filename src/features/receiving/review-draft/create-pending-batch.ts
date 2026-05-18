import { prisma } from '@/lib/prisma';

export async function createPendingReviewBatch(input: {
  userId: string;
  fileName: string;
}) {
  return prisma.uploadBatch.create({
    data: {
      uploadedByUserId: input.userId,
      originalFileName: input.fileName,
      storagePath: null,
      processingStatus: 'PENDING',
    },
    select: {
      id: true,
      originalFileName: true,
    },
  });
}
