import { beforeEach, describe, expect, it, vi } from 'vitest';

const { currentInventoryFindMany, auth } = vi.hoisted(() => ({
  currentInventoryFindMany: vi.fn(),
  auth: vi.fn(),
}));

vi.mock('@/features/account/auth', () => ({
  auth,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    currentInventory: {
      findMany: currentInventoryFindMany,
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
    currentInventoryFindMany.mockReset();
    auth.mockReset();

    auth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
  });

  it('loads products from current inventory', async () => {
    currentInventoryFindMany.mockResolvedValue([
      {
        count: 8,
        status: 'PLENTIFUL',
        lastChangedAt: new Date('2026-05-12T12:00:00.000Z'),
        lastChangedByUser: { name: 'admin' },
        lastPublishedAt: new Date('2026-05-12T12:00:00.000Z'),
        product: { id: 'bread', name: '食パン', category: 'BREAD' },
      },
      {
        count: 4,
        status: 'FEW_LEFT',
        lastChangedAt: new Date('2026-05-12T12:10:00.000Z'),
        lastChangedByUser: { name: 'admin' },
        lastPublishedAt: new Date('2026-05-12T12:00:00.000Z'),
        product: { id: 'soup', name: 'スープ', category: 'SOUP' },
      },
    ]);

    await expect(getInventoryProducts('fridge-1')).resolves.toEqual([
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

    expect(currentInventoryFindMany).toHaveBeenCalledWith({
      where: {
        fridgeId: 'fridge-1',
        isVisible: true,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        lastChangedByUser: {
          select: {
            name: true,
          },
        },
      },
    });
  });

  it('returns status and editor from current inventory row', async () => {
    currentInventoryFindMany.mockResolvedValue([
      {
        count: 8,
        status: 'SOLD_OUT',
        lastChangedAt: new Date('2026-05-12T12:30:00.000Z'),
        lastChangedByUser: { name: 'member' },
        lastPublishedAt: new Date('2026-05-12T12:00:00.000Z'),
        product: { id: 'bread', name: '食パン', category: 'BREAD' },
      },
    ]);

    await expect(getInventoryProducts('fridge-1')).resolves.toEqual([
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

  it('returns empty when current inventory has no visible rows', async () => {
    currentInventoryFindMany.mockResolvedValueOnce([]);
    await expect(getInventoryProducts('fridge-1')).resolves.toEqual([]);
  });
});
