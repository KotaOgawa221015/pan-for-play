'use server';

import { prisma } from '@/lib/prisma';
import type { InventoryPublicationSummary } from '@/types/inventory';
import { authenticatedAction } from '../auth/safe-actions';

async function getCurrentInventoryPublicationSummaryInternal(): Promise<InventoryPublicationSummary | null> {
  const publication = await prisma.inventoryPublication.findFirst({
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    include: {
      publishedByUser: {
        select: {
          name: true,
        },
      },
      uploadBatch: {
        select: {
          originalFileName: true,
        },
      },
      inventoryStatusChanges: {
        orderBy: [{ changedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        include: {
          changedByUser: {
            select: {
              name: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!publication) {
    return null;
  }

  const manualChangesAfterPublication =
    await prisma.inventoryStatusChange.findMany({
      where: {
        publicationId: null,
        changedAt: {
          gt: publication.publishedAt,
        },
      },
      orderBy: [{ changedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      include: {
        changedByUser: {
          select: {
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  return {
    originalFileName: publication.uploadBatch.originalFileName,
    publishedAt: publication.publishedAt.toISOString(),
    publishedByName: publication.publishedByUser.name,
    publicationChanges: publication.inventoryStatusChanges.map((change) => ({
      productId: change.product.id,
      productName: change.product.name,
      previousStatus: change.previousStatus,
      nextStatus: change.nextStatus,
      changedAt: change.changedAt.toISOString(),
      changedByName: change.changedByUser.name,
    })),
    manualChangesAfterPublication: manualChangesAfterPublication.map(
      (change) => ({
        productId: change.product.id,
        productName: change.product.name,
        previousStatus: change.previousStatus,
        nextStatus: change.nextStatus,
        changedAt: change.changedAt.toISOString(),
        changedByName: change.changedByUser.name,
      }),
    ),
  };
}
export const getCurrentInventoryPublicationSummary = authenticatedAction(
  getCurrentInventoryPublicationSummaryInternal,
);
