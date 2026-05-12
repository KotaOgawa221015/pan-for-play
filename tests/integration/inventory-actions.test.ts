import { beforeEach, describe, expect, it, vi } from 'vitest';

const { productFindMany, productUpdate, revalidatePath } = vi.hoisted(() => ({
  productFindMany: vi.fn(),
  productUpdate: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: productFindMany,
      update: productUpdate,
    },
  },
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

import { getInventoryProducts, updateProductStatus } from '@/app/actions';

describe('inventory server actions', () => {
  beforeEach(() => {
    productFindMany.mockReset();
    productUpdate.mockReset();
    revalidatePath.mockReset();
  });

  it('loads products ordered for the inventory board', async () => {
    productFindMany.mockResolvedValue([
      {
        id: 'bread',
        name: '食パン',
        status: 'PLENTIFUL',
        updatedAt: new Date('2026-05-12T10:00:00.000Z'),
      },
      {
        id: 'soup',
        name: 'スープ',
        status: 'FEW_LEFT',
        updatedAt: new Date('2026-05-12T11:00:00.000Z'),
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
    });
  });

  it('rejects persisted products with invalid statuses', async () => {
    productFindMany.mockResolvedValue([
      {
        id: 'bread',
        name: '食パン',
        status: 'BACKORDERED',
        updatedAt: new Date('2026-05-12T10:00:00.000Z'),
      },
    ]);

    await expect(getInventoryProducts()).rejects.toThrow(
      'Invalid status: BACKORDERED',
    );
  });

  it('updates status and revalidates inventory pages', async () => {
    productUpdate.mockResolvedValue({});

    await updateProductStatus('bread', 'SOLD_OUT');

    expect(productUpdate).toHaveBeenCalledWith({
      where: { id: 'bread' },
      data: { status: 'SOLD_OUT' },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('rejects invalid status updates before persistence', async () => {
    await expect(
      updateProductStatus('bread', 'BACKORDERED' as never),
    ).rejects.toThrow('Invalid status: BACKORDERED');

    expect(productUpdate).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
