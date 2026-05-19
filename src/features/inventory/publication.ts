import { getProductStatusFromCount } from './counts';

type InventoryLine = {
  productId: string;
  count: number;
};

type InventoryPublicationWriter = {
  inventoryPublication: {
    findFirst(args: {
      orderBy: Array<
        | { publishedAt: 'asc' | 'desc' }
        | { createdAt: 'asc' | 'desc' }
        | { id: 'asc' | 'desc' }
      >;
      include: {
        uploadBatch: {
          include: {
            lines: {
              select: {
                count: true;
                matchedProductId: true;
              };
            };
          };
        };
      };
    }): Promise<{
      uploadBatchId: string;
      uploadBatch: {
        lines: Array<{
          count: number;
          matchedProductId: string | null;
        }>;
      };
    } | null>;
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
};

function getLineStatuses(lines: InventoryLine[]) {
  return new Map(
    lines.map((line) => [
      line.productId,
      getProductStatusFromCount(line.count),
    ]),
  );
}

function buildStatusChanges(input: {
  currentStatuses: Map<string, ReturnType<typeof getProductStatusFromCount>>;
  nextLines: InventoryLine[];
  changedByUserId: string;
  changedAt: Date;
}) {
  const nextStatuses = getLineStatuses(input.nextLines);

  return [...nextStatuses.keys()].flatMap((productId) => {
    const previousStatus = input.currentStatuses.get(productId) ?? null;
    const nextStatus = nextStatuses.get(productId);

    if (!nextStatus || previousStatus === nextStatus) {
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

function getPublishedLines(
  publication: {
    uploadBatch: {
      lines: Array<{
        count: number;
        matchedProductId: string | null;
      }>;
    };
  } | null,
) {
  return (
    publication?.uploadBatch.lines.flatMap((line) =>
      line.matchedProductId
        ? [{ productId: line.matchedProductId, count: line.count }]
        : [],
    ) ?? []
  );
}

export async function publishInventorySnapshot(
  tx: InventoryPublicationWriter,
  input: {
    uploadBatchId: string;
    publishedByUserId: string;
    publishedAt: Date;
    lines: InventoryLine[];
  },
) {
  const currentPublication = await tx.inventoryPublication.findFirst({
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
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
  });

  if (currentPublication?.uploadBatchId === input.uploadBatchId) {
    throw new Error('この納品書はすでに現在の在庫として公開されています。');
  }

  const publication = await tx.inventoryPublication.create({
    data: {
      uploadBatchId: input.uploadBatchId,
      publishedByUserId: input.publishedByUserId,
      publishedAt: input.publishedAt,
    },
  });

  const previousPublishedStatuses = getLineStatuses(
    getPublishedLines(currentPublication),
  );
  const productIds = [...new Set(input.lines.map((line) => line.productId))];
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
    nextLines: input.lines,
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
