import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  transaction,
  currentInventoryFindUnique,
  currentInventoryUpdate,
  inventoryStatusChangeCreate,
  revalidatePath,
  requireCurrentUser,
  auth,
} = vi.hoisted(() => ({
  transaction: vi.fn(),
  currentInventoryFindUnique: vi.fn(),
  currentInventoryUpdate: vi.fn(),
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

vi.mock('@/features/account/auth', () => ({
  auth,
}));

vi.mock('@/features/account/session-user', () => ({
  authenticatedAction:
    (action: (user: { id: string }, ...args: unknown[]) => Promise<unknown>) =>
    async (...args: unknown[]) =>
      action(await requireCurrentUser(), ...args),
  requireCurrentUser,
}));

vi.mock('next/cache', () => ({
  revalidatePath,
}));

import { updateProductStatus } from './actions';

describe('inventory actions', () => {
  beforeEach(() => {
    transaction.mockReset();
    currentInventoryFindUnique.mockReset();
    currentInventoryUpdate.mockReset();
    inventoryStatusChangeCreate.mockReset();
    revalidatePath.mockReset();
    requireCurrentUser.mockReset();
    auth.mockReset();

    auth.mockResolvedValue({ user: { id: 'user-1' } });

    transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        currentInventory: {
          findUnique: currentInventoryFindUnique,
          update: currentInventoryUpdate,
        },
        inventoryStatusChange: {
          create: inventoryStatusChangeCreate,
        },
      }),
    );
  });

  it('creates a manual status change for a product on the current board', async () => {
    requireCurrentUser.mockResolvedValue({ id: 'user-1', role: 'MEMBER' });
    currentInventoryFindUnique.mockResolvedValue({
      status: 'PLENTIFUL',
      isVisible: true,
    });
    currentInventoryUpdate.mockResolvedValue({});
    inventoryStatusChangeCreate.mockResolvedValue({});

    await updateProductStatus('fridge-1', 'product-1', 'SOLD_OUT');
    expect(currentInventoryUpdate).toHaveBeenCalledWith({
      where: {
        fridgeId_productId: {
          fridgeId: 'fridge-1',
          productId: 'product-1',
        },
      },
      data: {
        status: 'SOLD_OUT',
        lastChangedAt: expect.any(Date),
        lastChangedByUserId: 'user-1',
      },
    });
    expect(inventoryStatusChangeCreate).toHaveBeenCalledWith({
      data: {
        fridgeId: 'fridge-1',
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
    currentInventoryFindUnique.mockResolvedValue({
      status: 'FEW_LEFT',
      isVisible: true,
    });

    await updateProductStatus('fridge-1', 'product-1', 'FEW_LEFT');
    expect(currentInventoryUpdate).not.toHaveBeenCalled();
    expect(inventoryStatusChangeCreate).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });
});
