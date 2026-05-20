'use server';

import { revalidatePath } from 'next/cache';

import { authenticatedAction } from '@/features/account/session-user';
import { getProductStatusFromCount } from '@/features/inventory/counts';
import { prisma } from '@/lib/prisma';
import type { ProductStatus } from '@/types/inventory';

async function updateProductStatusInternal(
  user: { id: string },
  productId: string,
  nextStatus: ProductStatus,
) {
  const changedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const currentPublication = await tx.inventoryPublication.findFirst({
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
    });

    const latestStatusChange = await tx.inventoryStatusChange.findFirst({
      where: {
        productId,
      },
      orderBy: [{ changedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      select: {
        nextStatus: true,
      },
    });

    const publicationLine = currentPublication?.uploadBatch.lines[0];
    if (!publicationLine) {
      throw new Error('現在の在庫ボードに存在しない商品は更新できません。');
    }

    const currentStatus =
      latestStatusChange?.nextStatus ??
      getProductStatusFromCount(publicationLine.count);

    if (currentStatus === nextStatus) return;

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

export const updateProductStatus = authenticatedAction(
  updateProductStatusInternal,
);
