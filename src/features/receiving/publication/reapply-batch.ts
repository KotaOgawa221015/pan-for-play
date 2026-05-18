'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/features/auth/auth';
import { requireAdminUser } from '@/features/auth/account-access';
import { prisma } from '@/lib/prisma';
import { createInventoryPublication } from './create-publication';

export async function reapplyReceivingBatch(batchId: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  const currentUserId = (await requireAdminUser()).id;
  const publishedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const [batch, currentPublication] = await Promise.all([
      tx.uploadBatch.findUnique({
        where: { id: batchId },
        include: {
          lines: {
            orderBy: { lineNumber: 'asc' },
          },
        },
      }),
      tx.inventoryPublication.findFirst({
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        include: {
          uploadBatch: {
            include: {
              lines: {
                select: {
                  count: true,
                  matchedProductId: true,
                },
              },
            },
          },
        },
      }),
    ]);

    if (!batch) {
      throw new Error('対象の納品書履歴が存在しません。');
    }

    if (batch.processingStatus !== 'PROCESSED') {
      throw new Error('公開できるのはレビュー済みの納品書だけです。');
    }

    if (currentPublication?.uploadBatchId === batch.id) {
      throw new Error('この納品書はすでに現在の在庫として公開されています。');
    }

    for (const line of batch.lines) {
      if (!line.matchedProductId) {
        throw new Error('紐付けが未確定の行があるため再適用できません。');
      }
    }

    await createInventoryPublication(tx, {
      uploadBatchId: batch.id,
      publishedByUserId: currentUserId,
      publishedAt,
      previousLines:
        currentPublication?.uploadBatch.lines.flatMap((line) =>
          line.matchedProductId
            ? [
                {
                  matchedProductId: line.matchedProductId,
                  count: line.count,
                },
              ]
            : [],
        ) ?? [],
      nextLines: batch.lines.flatMap((line) =>
        line.matchedProductId
          ? [
              {
                matchedProductId: line.matchedProductId,
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
