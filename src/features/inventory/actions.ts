'use server';

import { revalidatePath } from 'next/cache';
import { requireCurrentUser } from '@/features/auth/account-access';
import { getProductStatusFromCount } from '@/features/inventory/counts';
import { prisma } from '@/lib/prisma';
import type { ProductStatus } from '@/types/inventory';

export async function updateProductStatus(
  productId: string,
  nextStatus: ProductStatus,
) {
  const user = await requireCurrentUser();
  const changedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const [currentPublication, latestStatusChange] = await Promise.all([
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
                where: {
                  matchedProductId: productId,
                },
                select: {
                  id: true,
                  count: true,
                },
              },
            },
          },
        },
      }),
      tx.inventoryStatusChange.findFirst({
        where: {
          productId,
        },
        orderBy: [{ changedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        select: {
          nextStatus: true,
        },
      }),
    ]);

    const publicationLine = currentPublication?.uploadBatch.lines[0];
    if (!publicationLine) {
      throw new Error('現在の在庫ボードに存在しない商品は更新できません。');
    }

    const currentStatus =
      latestStatusChange?.nextStatus ??
      getProductStatusFromCount(publicationLine.count);

    if (currentStatus === nextStatus) {
      return;
    }

    await tx.inventoryStatusChange.create({
      data: {
        publicationId: null,
        productId,
        changedByUserId: user.id,
        previousStatus: currentStatus,
        nextStatus,
        changedAt,
      },
    });
  });

  revalidatePath('/');
}
