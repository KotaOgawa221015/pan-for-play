import { getProductStatusFromCount } from '@/features/inventory/counts';

type PublicationLine = {
  matchedProductId: string;
  count: number;
};

function getLineStatuses(lines: PublicationLine[]) {
  return new Map(
    lines.map((line) => [
      line.matchedProductId,
      getProductStatusFromCount(line.count),
    ]),
  );
}

function buildStatusChanges(input: {
  currentStatuses: Map<string, ReturnType<typeof getProductStatusFromCount>>;
  nextLines: PublicationLine[];
  changedByUserId: string;
  changedAt: Date;
}): Array<{
  productId: string;
  changedByUserId: string;
  previousStatus: ReturnType<typeof getProductStatusFromCount> | null;
  nextStatus: ReturnType<typeof getProductStatusFromCount>;
  changedAt: Date;
}> {
  const nextStatuses = getLineStatuses(input.nextLines);

  return [...nextStatuses.keys()].flatMap((productId) => {
    const previousStatus = input.currentStatuses.get(productId) ?? null;
    const nextStatus = nextStatuses.get(productId);

    if (!nextStatus) {
      return [];
    }

    if (previousStatus === nextStatus) {
      return [];
    }

    return [
      {
        productId,
        changedByUserId: input.changedByUserId,
        previousStatus,
        nextStatus,
        changedAt: input.changedAt,
      },
    ];
  });
}

export async function createInventoryPublication(
  tx: {
    inventoryPublication: {
      create(args: {
        data: {
          uploadBatchId: string;
          publishedByUserId: string;
          publishedAt: Date;
        };
      }): Promise<{ id: string }>;
    };
    inventoryStatusChange: {
      findMany(args: {
        where: {
          productId: {
            in: string[];
          };
        };
        orderBy: Array<
          | { changedAt: 'asc' | 'desc' }
          | { createdAt: 'asc' | 'desc' }
          | { id: 'asc' | 'desc' }
        >;
        select: {
          productId: true;
          nextStatus: true;
        };
      }): Promise<
        Array<{
          productId: string;
          nextStatus: ReturnType<typeof getProductStatusFromCount>;
        }>
      >;
      create(args: {
        data: {
          publicationId: string;
          productId: string;
          changedByUserId: string;
          previousStatus: ReturnType<typeof getProductStatusFromCount> | null;
          nextStatus: ReturnType<typeof getProductStatusFromCount>;
          changedAt: Date;
        };
      }): Promise<unknown>;
    };
  },
  input: {
    uploadBatchId: string;
    publishedByUserId: string;
    publishedAt: Date;
    previousLines: PublicationLine[];
    nextLines: PublicationLine[];
  },
) {
  const publication = await tx.inventoryPublication.create({
    data: {
      uploadBatchId: input.uploadBatchId,
      publishedByUserId: input.publishedByUserId,
      publishedAt: input.publishedAt,
    },
  });

  const previousPublishedStatuses = getLineStatuses(input.previousLines);
  const productIds = [
    ...new Set(input.nextLines.map((line) => line.matchedProductId)),
  ];
  const latestStatusChanges = productIds.length
    ? await tx.inventoryStatusChange.findMany({
        where: {
          productId: {
            in: productIds,
          },
        },
        orderBy: [{ changedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        select: {
          productId: true,
          nextStatus: true,
        },
      })
    : [];

  const currentStatuses = new Map(previousPublishedStatuses);
  const changedProductIds = new Set<string>();
  for (const change of latestStatusChanges) {
    if (
      !previousPublishedStatuses.has(change.productId) ||
      changedProductIds.has(change.productId)
    ) {
      continue;
    }

    currentStatuses.set(change.productId, change.nextStatus);
    changedProductIds.add(change.productId);
  }

  const statusChanges = buildStatusChanges({
    currentStatuses,
    nextLines: input.nextLines,
    changedByUserId: input.publishedByUserId,
    changedAt: input.publishedAt,
  });

  await Promise.all(
    statusChanges.map((change) =>
      tx.inventoryStatusChange.create({
        data: {
          publicationId: publication.id,
          productId: change.productId,
          changedByUserId: change.changedByUserId,
          previousStatus: change.previousStatus,
          nextStatus: change.nextStatus,
          changedAt: change.changedAt,
        },
      }),
    ),
  );
}
