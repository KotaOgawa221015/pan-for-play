import { beforeEach, describe, expect, it, vi } from 'vitest';

const { productFindMany, inventoryCheckCreate, revalidatePath, auth } =
  vi.hoisted(() => ({
    productFindMany: vi.fn(),
    inventoryCheckCreate: vi.fn(),
    revalidatePath: vi.fn(),
    auth: vi.fn(),
  }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: productFindMany,
    },
    inventoryCheck: {
      create: inventoryCheckCreate,
    },
  },
}));

vi.mock('@/features/auth/auth', () => ({
  auth,
}));

vi.mock('next/cache', () => ({
  revalidatePath,
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

import {
  getInventoryProducts,
  updateProductStatus,
} from '@/features/inventory/product-inventory';

describe('inventory server actions', () => {
  beforeEach(() => {
    productFindMany.mockReset();
    inventoryCheckCreate.mockReset();
    revalidatePath.mockReset();
    auth.mockReset();
  });

  it('loads products ordered for the inventory board', async () => {
    auth.mockResolvedValue({ user: { id: 'admin-1' } });
    productFindMany.mockResolvedValue([
      {
        id: 'bread',
        name: '食パン',
        inventoryChecks: [
          {
            status: 'PLENTIFUL',
            checkedAt: new Date('2026-05-12T10:00:00.000Z'),
          },
        ],
      },
      {
        id: 'soup',
        name: 'スープ',
        inventoryChecks: [
          {
            status: 'FEW_LEFT',
            checkedAt: new Date('2026-05-12T11:00:00.000Z'),
          },
        ],
      },
    ]);

    await expect(getInventoryProducts()).resolves.toEqual([
      {
        id: 'bread',
        name: '食パン',
        status: 'PLENTIFUL',
        updatedAt: '2026-05-12T10:00:00.000Z',
      },
      {
        id: 'soup',
        name: 'スープ',
        status: 'FEW_LEFT',
        updatedAt: '2026-05-12T11:00:00.000Z',
      },
    ]);

    expect(productFindMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      include: {
        inventoryChecks: {
          orderBy: { checkedAt: 'desc' },
          take: 1,
        },
      },
    });
  });

  it('rejects persisted products with invalid statuses', async () => {
    auth.mockResolvedValue({ user: { id: 'admin-1' } });
    productFindMany.mockResolvedValue([
      {
        id: 'bread',
        name: '食パン',
        inventoryChecks: [
          {
            status: 'BACKORDERED',
            checkedAt: new Date('2026-05-12T10:00:00.000Z'),
          },
        ],
      },
    ]);

    await expect(getInventoryProducts()).rejects.toThrow(
      'Invalid status: BACKORDERED',
    );
  });

  it('updates status and revalidates inventory pages', async () => {
    auth.mockResolvedValue({ user: { id: 'user-1' } });
    inventoryCheckCreate.mockResolvedValue({});

    await updateProductStatus('bread', 'SOLD_OUT');

    expect(inventoryCheckCreate).toHaveBeenCalledWith({
      data: {
        productId: 'bread',
        checkedByUserId: 'user-1',
        status: 'SOLD_OUT',
        sourceType: 'MANUAL',
        checkedAt: expect.any(Date),
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('rejects invalid status updates before persistence', async () => {
    auth.mockResolvedValue({ user: { id: 'admin-1' } });
    await expect(
      updateProductStatus('bread', 'BACKORDERED' as never),
    ).rejects.toThrow('Invalid status: BACKORDERED');

    expect(inventoryCheckCreate).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
