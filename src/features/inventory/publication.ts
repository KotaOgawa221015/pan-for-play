import { getProductStatusFromCount } from './counts';

type InventoryLine = {
  productId: string;
  count: number;
};

type InventoryPublicationWriter = {
  inventoryPublication: {
    findFirst(args: {
      where?: {
        fridgeId: string;
        uploadBatch?: {
          is: {
            deletedAt: Date | null;
          };
        };
      };
      orderBy: Array<
        | { publishedAt: 'asc' | 'desc' }
        | { createdAt: 'asc' | 'desc' }
        | { id: 'asc' | 'desc' }
      >;
      select: {
        uploadBatchId: true;
        uploadBatch: {
          select: {
            deletedAt: true;
          };
        };
      };
    }): Promise<{
      uploadBatchId: string;
      uploadBatch: {
        deletedAt: Date | null;
      };
    } | null>;
    create(args: {
      data: {
        fridgeId: string;
        uploadBatchId: string;
        publishedByUserId: string;
        publishedAt: Date;
      };
    }): Promise<{ id: string }>;
  };
  currentInventory: {
    findMany(args: {
      where: {
        fridgeId: string;
      };
      select: {
        productId: true;
        status: true;
        isVisible: true;
        lastChangedAt: true;
        lastChangedByUserId: true;
      };
    }): Promise<
      Array<{
        productId: string;
        status: ReturnType<typeof getProductStatusFromCount>;
        isVisible: boolean;
        lastChangedAt: Date | null;
        lastChangedByUserId: string | null;
      }>
    >;
    upsert(args: {
      where: {
        fridgeId_productId: {
          fridgeId: string;
          productId: string;
        };
      };
      update: {
        count: number;
        status: ReturnType<typeof getProductStatusFromCount>;
        isVisible: boolean;
        lastPublishedAt: Date;
        lastChangedAt: Date | null;
        lastChangedByUserId: string | null;
      };
      create: {
        fridgeId: string;
        productId: string;
        count: number;
        status: ReturnType<typeof getProductStatusFromCount>;
        isVisible: boolean;
        lastPublishedAt: Date;
        lastChangedAt: Date | null;
        lastChangedByUserId: string | null;
      };
    }): Promise<unknown>;
    updateMany(args: {
      where: {
        fridgeId: string;
        productId?: {
          notIn: string[];
        };
      };
      data: {
        isVisible: boolean;
      };
    }): Promise<unknown>;
  };
  inventoryStatusChange: {
    create(args: {
      data: {
        fridgeId: string;
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

function getNextLinesByProductId(lines: InventoryLine[]) {
  const nextLinesByProductId = new Map<string, InventoryLine>();
  for (const line of lines) {
    nextLinesByProductId.set(line.productId, line);
  }

  return nextLinesByProductId;
}

export async function publishInventorySnapshot(
  tx: InventoryPublicationWriter,
  input: {
    fridgeId: string;
    uploadBatchId: string;
    publishedByUserId: string;
    publishedAt: Date;
    lines: InventoryLine[];
  },
) {
  const currentPublication = await tx.inventoryPublication.findFirst({
    where: {
      fridgeId: input.fridgeId,
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    select: {
      uploadBatchId: true,
      uploadBatch: {
        select: {
          deletedAt: true,
        },
      },
    },
  });

  if (
    currentPublication &&
    !currentPublication.uploadBatch.deletedAt &&
    currentPublication.uploadBatchId === input.uploadBatchId
  ) {
    throw new Error('この納品書はすでに現在の在庫として公開されています。');
  }

  const publication = await tx.inventoryPublication.create({
    data: {
      fridgeId: input.fridgeId,
      uploadBatchId: input.uploadBatchId,
      publishedByUserId: input.publishedByUserId,
      publishedAt: input.publishedAt,
    },
  });

  const nextLinesByProductId = getNextLinesByProductId(input.lines);
  const nextProductIds = [...nextLinesByProductId.keys()];
  const currentInventories = await tx.currentInventory.findMany({
    where: {
      fridgeId: input.fridgeId,
    },
    select: {
      productId: true,
      status: true,
      isVisible: true,
      lastChangedAt: true,
      lastChangedByUserId: true,
    },
  });
  const currentInventoryByProductId = new Map(
    currentInventories.map((inventory) => [inventory.productId, inventory]),
  );

  const statusChanges: Array<{
    productId: string;
    previousStatus: ReturnType<typeof getProductStatusFromCount> | null;
    nextStatus: ReturnType<typeof getProductStatusFromCount>;
  }> = [];

  for (const [productId, nextLine] of nextLinesByProductId.entries()) {
    const nextStatus = getProductStatusFromCount(nextLine.count);
    const currentInventory = currentInventoryByProductId.get(productId);
    const previousStatus = currentInventory?.isVisible
      ? currentInventory.status
      : null;
    const hasStatusChanged = previousStatus !== nextStatus;

    await tx.currentInventory.upsert({
      where: {
        fridgeId_productId: {
          fridgeId: input.fridgeId,
          productId,
        },
      },
      update: {
        count: nextLine.count,
        status: nextStatus,
        isVisible: nextLine.count > 0,
        lastPublishedAt: input.publishedAt,
        lastChangedAt: hasStatusChanged
          ? input.publishedAt
          : (currentInventory?.lastChangedAt ?? null),
        lastChangedByUserId: hasStatusChanged
          ? input.publishedByUserId
          : (currentInventory?.lastChangedByUserId ?? null),
      },
      create: {
        fridgeId: input.fridgeId,
        productId,
        count: nextLine.count,
        status: nextStatus,
        isVisible: nextLine.count > 0,
        lastPublishedAt: input.publishedAt,
        lastChangedAt: hasStatusChanged ? input.publishedAt : null,
        lastChangedByUserId: hasStatusChanged ? input.publishedByUserId : null,
      },
    });

    if (hasStatusChanged) {
      statusChanges.push({
        productId,
        previousStatus,
        nextStatus,
      });
    }
  }

  if (nextProductIds.length > 0) {
    await tx.currentInventory.updateMany({
      where: {
        fridgeId: input.fridgeId,
        productId: {
          notIn: nextProductIds,
        },
      },
      data: {
        isVisible: false,
      },
    });
  } else {
    await tx.currentInventory.updateMany({
      where: {
        fridgeId: input.fridgeId,
      },
      data: {
        isVisible: false,
      },
    });
  }

  await Promise.all(
    statusChanges.map((change) =>
      tx.inventoryStatusChange.create({
        data: {
          fridgeId: input.fridgeId,
          publicationId: publication.id,
          productId: change.productId,
          changedByUserId: input.publishedByUserId,
          previousStatus: change.previousStatus,
          nextStatus: change.nextStatus,
          changedAt: input.publishedAt,
        },
      }),
    ),
  );
}
