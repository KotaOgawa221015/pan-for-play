import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  transaction,
  inventoryPublicationFindFirst,
  inventoryStatusChangeFindFirst,
  inventoryStatusChangeCreate,
  revalidatePath,
  requireCurrentUser,
  auth,
} = vi.hoisted(() => ({
  transaction: vi.fn(),
  inventoryPublicationFindFirst: vi.fn(),
  inventoryStatusChangeFindFirst: vi.fn(),
  inventoryStatusChangeCreate: vi.fn(),
  revalidatePath: vi.fn(),
  requireCurrentUser: vi.fn(),
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: transaction,
  },
}));

vi.mock('@/features/auth/auth', () => ({
  auth,
}));

vi.mock('@/features/auth/session-user', () => ({
  requireCurrentUser,
}));

vi.mock('next/cache', () => ({
  revalidatePath,
}));

import { updateProductStatus } from './actions';

describe('inventory actions', () => {
  beforeEach(() => {
    transaction.mockReset();
    inventoryPublicationFindFirst.mockReset();
    inventoryStatusChangeFindFirst.mockReset();
    inventoryStatusChangeCreate.mockReset();
    revalidatePath.mockReset();
    requireCurrentUser.mockReset();
    auth.mockReset();

    auth.mockResolvedValue({ user: { id: 'user-1' } });

    transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        inventoryPublication: {
          findFirst: inventoryPublicationFindFirst,
        },
        inventoryStatusChange: {
          findFirst: inventoryStatusChangeFindFirst,
          create: inventoryStatusChangeCreate,
        },
      }),
    );
  });

  it('creates a manual status change for a product on the current board', async () => {
    requireCurrentUser.mockResolvedValue({ id: 'user-1', role: 'MEMBER' });
    inventoryPublicationFindFirst.mockResolvedValue({
      uploadBatch: {
        lines: [{ id: 'line-1', count: 8 }],
      },
    });
    inventoryStatusChangeFindFirst.mockResolvedValue(null);
    inventoryStatusChangeCreate.mockResolvedValue({});

    await updateProductStatus('product-1', 'SOLD_OUT');

    expect(inventoryStatusChangeCreate).toHaveBeenCalledWith({
      data: {
        publicationId: null,
        productId: 'product-1',
        changedByUserId: 'user-1',
        previousStatus: 'PLENTIFUL',
        nextStatus: 'SOLD_OUT',
        changedAt: expect.any(Date),
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('skips persistence when the requested status is already current', async () => {
    requireCurrentUser.mockResolvedValue({ id: 'user-1', role: 'MEMBER' });
    inventoryPublicationFindFirst.mockResolvedValue({
      uploadBatch: {
        lines: [{ id: 'line-1', count: 8 }],
      },
    });
    inventoryStatusChangeFindFirst.mockResolvedValue({
      nextStatus: 'FEW_LEFT',
    });

    await updateProductStatus('product-1', 'FEW_LEFT');

    expect(inventoryStatusChangeCreate).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });
});
