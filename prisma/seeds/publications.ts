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
  defaultFridge: { id: string },
) {
  let previousPublicationLines: PublicationLine[] = [];

  for (const publication of publications) {
    const previousCurrentInventoryRows = await prisma.currentInventory.findMany(
      {
        where: {
          fridgeId: defaultFridge.id,
        },
        select: {
          productId: true,
          lastChangedAt: true,
          lastChangedByUserId: true,
        },
      },
    );
    const previousCurrentInventoryByProductId = new Map(
      previousCurrentInventoryRows.map((row) => [row.productId, row]),
    );

    const createdPublication = await prisma.inventoryPublication.create({
      data: {
        fridgeId: defaultFridge.id,
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
    const statusChangeProductIdSet = new Set(
      statusChanges.map((change) => change.productId),
    );
    const publicationProductIds = [
      ...new Set(publication.publicationLines.map((line) => line.productId)),
    ];

    for (const change of statusChanges) {
      await prisma.inventoryStatusChange.create({
        data: {
          fridgeId: defaultFridge.id,
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

    for (const line of publication.publicationLines) {
      const previousCurrentInventory = previousCurrentInventoryByProductId.get(
        line.productId,
      );
      const hasStatusChange = statusChangeProductIdSet.has(line.productId);

      await prisma.currentInventory.upsert({
        where: {
          fridgeId_productId: {
            fridgeId: defaultFridge.id,
            productId: line.productId,
          },
        },
        update: {
          count: line.count,
          status: statusFromCount(line.count),
          isVisible: line.count > 0,
          lastPublishedAt: publication.publishedAt,
          lastChangedAt: hasStatusChange
            ? publication.publishedAt
            : (previousCurrentInventory?.lastChangedAt ?? null),
          lastChangedByUserId: hasStatusChange
            ? adminUser.id
            : (previousCurrentInventory?.lastChangedByUserId ?? null),
        },
        create: {
          fridgeId: defaultFridge.id,
          productId: line.productId,
          count: line.count,
          status: statusFromCount(line.count),
          isVisible: line.count > 0,
          lastPublishedAt: publication.publishedAt,
          lastChangedAt: hasStatusChange ? publication.publishedAt : null,
          lastChangedByUserId: hasStatusChange ? adminUser.id : null,
        },
      });
    }

    if (publicationProductIds.length > 0) {
      await prisma.currentInventory.updateMany({
        where: {
          fridgeId: defaultFridge.id,
          productId: {
            notIn: publicationProductIds,
          },
        },
        data: {
          isVisible: false,
        },
      });
    } else {
      await prisma.currentInventory.updateMany({
        where: {
          fridgeId: defaultFridge.id,
        },
        data: {
          isVisible: false,
        },
      });
    }

    previousPublicationLines = publication.publicationLines;
  }
}
