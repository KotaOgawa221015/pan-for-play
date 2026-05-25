import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  transaction,
  uploadBatchFindFirst,
  uploadBatchFindUnique,
  uploadBatchUpdate,
  fridgeFindFirst,
  inventoryPublicationFindFirst,
  inventoryPublicationCreate,
  inventoryStatusChangeFindMany,
  inventoryStatusChangeCreate,
  revalidatePath,
  requireAdminUser,
  auth,
} = vi.hoisted(() => ({
  transaction: vi.fn(),
  uploadBatchFindFirst: vi.fn(),
  uploadBatchFindUnique: vi.fn(),
  uploadBatchUpdate: vi.fn(),
  fridgeFindFirst: vi.fn(),
  inventoryPublicationFindFirst: vi.fn(),
  inventoryPublicationCreate: vi.fn(),
  inventoryStatusChangeFindMany: vi.fn(),
  inventoryStatusChangeCreate: vi.fn(),
  revalidatePath: vi.fn(),
  requireAdminUser: vi.fn(),
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: transaction,
    uploadBatch: {
      findFirst: uploadBatchFindFirst,
      findUnique: uploadBatchFindUnique,
      update: uploadBatchUpdate,
    },
    fridge: {
      findFirst: fridgeFindFirst,
    },
    inventoryPublication: {
      findFirst: inventoryPublicationFindFirst,
      create: inventoryPublicationCreate,
    },
    inventoryStatusChange: {
      findMany: inventoryStatusChangeFindMany,
      create: inventoryStatusChangeCreate,
    },
  },
}));

vi.mock('@/features/account/auth', () => ({
  auth,
}));

vi.mock('@/features/account/session-user', () => ({
  adminAction:
    (action: (admin: { id: string }, ...args: unknown[]) => Promise<unknown>) =>
    async (...args: unknown[]) =>
      action(await requireAdminUser(), ...args),
  requireAdminUser,
}));

vi.mock('next/cache', () => ({
  revalidatePath,
}));

import { deleteReceivingBatch } from '@/features/receiving/history/delete-batch';
import { reapplyReceivingBatch } from '@/features/receiving/publication/reapply-batch';

describe('receiving history actions', () => {
  beforeEach(() => {
    transaction.mockReset();
    uploadBatchFindFirst.mockReset();
    uploadBatchFindUnique.mockReset();
    uploadBatchUpdate.mockReset();
    fridgeFindFirst.mockReset();
    inventoryPublicationFindFirst.mockReset();
    inventoryPublicationCreate.mockReset();
    inventoryStatusChangeFindMany.mockReset();
    inventoryStatusChangeCreate.mockReset();
    revalidatePath.mockReset();
    requireAdminUser.mockReset();
    auth.mockReset();

    auth.mockResolvedValue({ user: { id: 'user-1', role: 'ADMIN' } });

    transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        uploadBatch: {
          findFirst: uploadBatchFindFirst,
          findUnique: uploadBatchFindUnique,
          update: uploadBatchUpdate,
        },
        fridge: {
          findFirst: fridgeFindFirst,
        },
        inventoryPublication: {
          findFirst: inventoryPublicationFindFirst,
          create: inventoryPublicationCreate,
        },
        inventoryStatusChange: {
          findMany: inventoryStatusChangeFindMany,
          create: inventoryStatusChangeCreate,
        },
      }),
    );
  });

  it('reapplies and deletes batches through history actions', async () => {
    requireAdminUser.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
    fridgeFindFirst.mockResolvedValue({
      id: 'fridge-2',
    });
    inventoryPublicationFindFirst
      .mockResolvedValueOnce({
        uploadBatchId: 'batch-2',
        uploadBatch: {
          lines: [
            {
              matchedProductId: 'product-2',
              count: 9,
            },
          ],
        },
      })
      .mockResolvedValueOnce(null);
    inventoryPublicationCreate.mockResolvedValue({
      id: 'publication-2',
    });
    inventoryStatusChangeFindMany.mockResolvedValue([]);
    inventoryStatusChangeCreate.mockResolvedValue({});
    uploadBatchFindFirst.mockResolvedValueOnce({
      id: 'batch-1',
      fridgeId: 'fridge-1',
      lines: [
        {
          matchedProductId: 'product-1',
          count: 3,
        },
      ],
    });
    uploadBatchFindUnique.mockResolvedValueOnce({
      id: 'batch-1',
      deletedAt: null,
    });
    uploadBatchUpdate.mockResolvedValue({});

    await reapplyReceivingBatch({
      batchId: 'batch-1',
      fridgeId: 'fridge-2',
    });
    await deleteReceivingBatch('batch-1');

    expect(inventoryPublicationCreate).toHaveBeenCalledWith({
      data: {
        fridgeId: 'fridge-2',
        uploadBatchId: 'batch-1',
        publishedByUserId: 'user-1',
        publishedAt: expect.any(Date),
      },
    });
    expect(uploadBatchUpdate).toHaveBeenCalledWith({
      where: { id: 'batch-1' },
      data: {
        deletedAt: expect.any(Date),
      },
    });
  });
});
