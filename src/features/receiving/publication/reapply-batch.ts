'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/features/account/auth';
import { requireAdminUser } from '@/features/account/session-user';
import { publishInventorySnapshot } from '@/features/inventory/publication';
import { prisma } from '@/lib/prisma';

export async function reapplyReceivingBatch(input: {
  batchId: string;
  fridgeId: string;
}) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
  const currentUserId = (await requireAdminUser()).id;
  const targetFridgeId = input.fridgeId.trim();

  if (!targetFridgeId) {
    throw new Error('再適用先の冷蔵庫を選択してください。');
  }

  const publishedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const fridge = await tx.fridge.findFirst({
      where: {
        id: targetFridgeId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!fridge) {
      throw new Error('再適用先の冷蔵庫が存在しません。');
    }

    const batch = await tx.uploadBatch.findFirst({
      where: {
        id: input.batchId,
        deletedAt: null,
      },
      include: {
        lines: {
          orderBy: { lineNumber: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new Error('対象の納品書履歴が存在しません。');
    }

    if (batch.lines.length === 0) {
      throw new Error('再適用対象の納品書行が存在しません。');
    }

    for (const line of batch.lines) {
      if (!line.matchedProductId) {
        throw new Error('紐付けが未確定の行があるため再適用できません。');
      }
    }

    await publishInventorySnapshot(tx, {
      fridgeId: fridge.id,
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
