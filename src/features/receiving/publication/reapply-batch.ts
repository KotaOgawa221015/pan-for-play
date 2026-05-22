'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/features/account/auth';
import { requireAdminUser } from '@/features/account/session-user';
import { publishInventorySnapshot } from '@/features/inventory/publication';
import { prisma } from '@/lib/prisma';

export async function reapplyReceivingBatch(batchId: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  const currentUserId = (await requireAdminUser()).id;
  const publishedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const batch = await tx.uploadBatch.findUnique({
      where: { id: batchId },
      include: {
        lines: {
          orderBy: { lineNumber: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new Error('対象の納品書履歴が存在しません。');
    }

    if (batch.processingStatus !== 'PROCESSED') {
      throw new Error('公開できるのはレビュー済みの納品書だけです。');
    }

    for (const line of batch.lines) {
      if (!line.matchedProductId) {
        throw new Error('紐付けが未確定の行があるため再適用できません。');
      }
    }

    await publishInventorySnapshot(tx, {
      fridgeId: batch.fridgeId,
      uploadBatchId: batch.id,
      publishedByUserId: currentUserId,
      publishedAt,
      lines: batch.lines.flatMap((line) =>
        line.matchedProductId
          ? [
              {
                productId: line.matchedProductId,
                count: line.count,
              },
            ]
          : [],
      ),
    });
  });

  revalidatePath('/');
  revalidatePath('/admin');
}
