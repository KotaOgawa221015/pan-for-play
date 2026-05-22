import { beforeEach, describe, expect, it, vi } from 'vitest';

const { inventoryPublicationFindFirst, inventoryStatusChangeFindMany, auth } =
  vi.hoisted(() => ({
    inventoryPublicationFindFirst: vi.fn(),
    inventoryStatusChangeFindMany: vi.fn(),
    auth: vi.fn(),
  }));

vi.mock('@/features/account/auth', () => ({
  auth,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    inventoryPublication: {
      findFirst: inventoryPublicationFindFirst,
    },
    inventoryStatusChange: {
      findMany: inventoryStatusChangeFindMany,
    },
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

import { getInventoryProducts } from '@/features/inventory/product-inventory';

describe('inventory server actions', () => {
  beforeEach(() => {
    inventoryPublicationFindFirst.mockReset();
    inventoryStatusChangeFindMany.mockReset();
    auth.mockReset();

    auth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
  });

  it('loads products from the latest inventory publication', async () => {
    inventoryPublicationFindFirst.mockResolvedValue({
      publishedAt: new Date('2026-05-12T12:00:00.000Z'),
      uploadBatch: {
        lines: [
          {
            count: 8,
            matchedProduct: { id: 'bread', name: '食パン', category: 'BREAD' },
          },
          {
            count: 4,
            matchedProduct: { id: 'soup', name: 'スープ', category: 'SOUP' },
          },
        ],
      },
    });
    inventoryStatusChangeFindMany.mockResolvedValue([
      {
        productId: 'soup',
        changedAt: new Date('2026-05-12T12:10:00.000Z'),
        changedByUser: { name: 'admin' },
      },
      {
        productId: 'bread',
        changedAt: new Date('2026-05-12T12:00:00.000Z'),
        changedByUser: { name: 'admin' },
      },
    ]);

    await expect(getInventoryProducts()).resolves.toEqual([
      {
        id: 'soup',
        name: 'スープ',
        category: 'SOUP',
        count: 4,
        status: 'FEW_LEFT',
        lastStatusChangedAt: '2026-05-12T12:10:00.000Z',
        lastStatusChangedByName: 'admin',
        lastPublishedAt: '2026-05-12T12:00:00.000Z',
      },
      {
        id: 'bread',
        name: '食パン',
        category: 'BREAD',
        count: 8,
        status: 'PLENTIFUL',
        lastStatusChangedAt: '2026-05-12T12:00:00.000Z',
        lastStatusChangedByName: 'admin',
        lastPublishedAt: '2026-05-12T12:00:00.000Z',
      },
    ]);

    expect(inventoryPublicationFindFirst).toHaveBeenCalledWith({
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      include: {
        uploadBatch: {
          include: {
            lines: {
              orderBy: {
                lineNumber: 'asc',
              },
              include: {
                matchedProduct: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  });

  it('prefers the latest manual status change over the publication-derived status', async () => {
    inventoryPublicationFindFirst.mockResolvedValue({
      publishedAt: new Date('2026-05-12T12:00:00.000Z'),
      uploadBatch: {
        lines: [
          {
            count: 8,
            matchedProduct: { id: 'bread', name: '食パン', category: 'BREAD' },
          },
        ],
      },
    });
    inventoryStatusChangeFindMany.mockResolvedValue([
      {
        productId: 'bread',
        changedAt: new Date('2026-05-12T12:30:00.000Z'),
        nextStatus: 'SOLD_OUT',
        changedByUser: { name: 'member' },
      },
    ]);

    await expect(getInventoryProducts()).resolves.toEqual([
      {
        id: 'bread',
        name: '食パン',
        category: 'BREAD',
        count: 8,
        status: 'SOLD_OUT',
        lastStatusChangedAt: '2026-05-12T12:30:00.000Z',
        lastStatusChangedByName: 'member',
        lastPublishedAt: '2026-05-12T12:00:00.000Z',
      },
    ]);
  });

  it('hides zero-count lines and returns empty when no publication exists', async () => {
    inventoryPublicationFindFirst.mockResolvedValueOnce({
      publishedAt: new Date('2026-05-12T12:00:00.000Z'),
      uploadBatch: {
        lines: [
          {
            count: 0,
            matchedProduct: { id: 'bread', name: '食パン', category: 'BREAD' },
          },
        ],
      },
    });
    inventoryStatusChangeFindMany.mockResolvedValueOnce([]);

    await expect(getInventoryProducts()).resolves.toEqual([]);

    inventoryPublicationFindFirst.mockResolvedValueOnce(null);
    await expect(getInventoryProducts()).resolves.toEqual([]);
  });
});
