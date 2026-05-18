import { InventoryStatus, type PrismaClient, type User } from '@prisma/client';
import type { PublicationLine, PublicationSeed } from './receiving.ts';

type StatusChange = {
  productId: string;
  previousStatus: InventoryStatus | null;
  nextStatus: InventoryStatus;
};

function statusFromCount(count: number) {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`Invalid inventory count in seed fixture: ${count}`);
  }
  if (count === 0) return InventoryStatus.SOLD_OUT;
  if (count <= 5) return InventoryStatus.FEW_LEFT;
  return InventoryStatus.PLENTIFUL;
}

function getStatusByProduct(lines: PublicationLine[]) {
  const statuses = new Map<string, InventoryStatus>();

  for (const line of lines) {
    statuses.set(line.productId, statusFromCount(line.count));
  }

  return statuses;
}

function buildStatusChanges(
  previousLines: PublicationLine[],
  nextLines: PublicationLine[],
) {
  const previousStatuses = getStatusByProduct(previousLines);
  const nextStatuses = getStatusByProduct(nextLines);

  const changes: StatusChange[] = [];

  for (const productId of nextStatuses.keys()) {
    const previousStatus = previousStatuses.get(productId) ?? null;
    const nextStatus = nextStatuses.get(productId);

    if (!nextStatus) {
      continue;
    }

    if (previousStatus === nextStatus) {
      continue;
    }

    changes.push({
      productId,
      previousStatus,
      nextStatus,
    });
  }

  return changes;
}

export async function seedPublications(
  prisma: PrismaClient,
  adminUser: User,
  publications: PublicationSeed[],
) {
  let previousPublicationLines: PublicationLine[] = [];

  for (const publication of publications) {
    const createdPublication = await prisma.inventoryPublication.create({
      data: {
        uploadBatchId: publication.batchId,
        publishedByUserId: adminUser.id,
        publishedAt: publication.publishedAt,
        createdAt: publication.publishedAt,
      },
    });

    const statusChanges = buildStatusChanges(
      previousPublicationLines,
      publication.publicationLines,
    );

    for (const change of statusChanges) {
      await prisma.inventoryStatusChange.create({
        data: {
          publicationId: createdPublication.id,
          productId: change.productId,
          changedByUserId: adminUser.id,
          previousStatus: change.previousStatus,
          nextStatus: change.nextStatus,
          changedAt: publication.publishedAt,
          createdAt: publication.publishedAt,
        },
      });
    }

    previousPublicationLines = publication.publicationLines;
  }
}
