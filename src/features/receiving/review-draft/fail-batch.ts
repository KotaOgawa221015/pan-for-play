import { prisma } from '@/lib/prisma';

export async function failReviewBatch(batchId: string) {
  await prisma.$transaction(async (tx) => {
    const batch = await tx.uploadBatch.findUnique({
      where: { id: batchId },
      include: {
        _count: {
          select: {
            inventoryPublications: true,
          },
        },
      },
    });

    if (!batch) {
      return;
    }

    if (batch._count.inventoryPublications > 0) {
      throw new Error(
        '公開済みの納品書履歴は読み取り失敗として破棄できません。',
      );
    }

    await tx.uploadBatchLine.deleteMany({
      where: { uploadBatchId: batch.id },
    });

    await tx.uploadBatch.delete({
      where: { id: batch.id },
    });
  });
}
