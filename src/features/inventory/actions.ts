'use server';

import { revalidatePath } from 'next/cache';

import { authenticatedAction } from '@/features/account/session-user';
import { prisma } from '@/lib/prisma';
import type { ProductStatus } from '@/types/inventory';

async function updateProductStatusInternal(
  user: { id: string },
  fridgeId: string,
  productId: string,
  nextStatus: ProductStatus,
) {
  const changedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const currentInventory = await tx.currentInventory.findUnique({
      where: {
        fridgeId_productId: {
          fridgeId,
          productId,
        },
      },
      select: {
        status: true,
        isVisible: true,
      },
    });

    if (!currentInventory?.isVisible) {
      throw new Error('現在の在庫ボードに存在しない商品は更新できません。');
    }

    const currentStatus = currentInventory.status;

    if (currentStatus === nextStatus) return;

    await tx.currentInventory.update({
      where: {
        fridgeId_productId: {
          fridgeId,
          productId,
        },
      },
      data: {
        status: nextStatus,
        lastChangedAt: changedAt,
        lastChangedByUserId: user.id,
      },
    });

    await tx.inventoryStatusChange.create({
      data: {
        fridgeId,
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
