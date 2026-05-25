import { prisma } from '@/lib/prisma';
import type { HistoryEntry } from '../types';

export async function getRecentReceivingHistory(): Promise<HistoryEntry[]> {
  const [publications, batches] = await Promise.all([
    prisma.inventoryPublication.findMany({
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      select: {
        fridgeId: true,
        uploadBatchId: true,
        fridge: {
          select: {
            name: true,
          },
        },
        uploadBatch: {
          select: {
            deletedAt: true,
          },
        },
      },
    }),
    prisma.uploadBatch.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        lines: {
          orderBy: { lineNumber: 'asc' },
          include: {
            matchedProduct: {
              select: {
                name: true,
              },
            },
          },
        },
        inventoryPublications: {
          orderBy: [
            { publishedAt: 'desc' },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
          include: {
            fridge: {
              select: {
                name: true,
              },
            },
            publishedByUser: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const seenFridgeIds = new Set<string>();
  const currentFridgeNamesByBatchId = new Map<string, string[]>();
  for (const publication of publications) {
    if (seenFridgeIds.has(publication.fridgeId)) {
      continue;
    }

    seenFridgeIds.add(publication.fridgeId);
    if (publication.uploadBatch.deletedAt) {
      continue;
    }

    const fridgeNames =
      currentFridgeNamesByBatchId.get(publication.uploadBatchId) ?? [];
    fridgeNames.push(publication.fridge.name);
    currentFridgeNamesByBatchId.set(publication.uploadBatchId, fridgeNames);
  }

  return batches.map((batch) => {
    return {
      id: batch.id,
      originalFileName: batch.originalFileName,
      createdAt: batch.createdAt.toISOString(),
      processedAt: batch.processedAt?.toISOString() ?? null,
      hasPublication: batch.inventoryPublications.length > 0,
      appliedFridgeNames: currentFridgeNamesByBatchId.get(batch.id) ?? [],
      lastPublishedByName:
        batch.inventoryPublications[0]?.publishedByUser.name ?? null,
      isCurrent: currentFridgeNamesByBatchId.has(batch.id),
      lines: batch.lines.map((line) => ({
        id: line.id,
        name: line.rawText,
        count: line.count,
        matchedProductName: line.matchedProduct?.name ?? null,
      })),
    };
  });
}
