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

import { getCurrentInventoryPublicationSummary } from '@/features/inventory/publication-summary';

describe('inventory publication summary', () => {
  beforeEach(() => {
    inventoryPublicationFindFirst.mockReset();
    inventoryStatusChangeFindMany.mockReset();
    auth.mockReset();

    auth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
  });

  it('returns publication changes and manual changes after that publication', async () => {
    inventoryPublicationFindFirst.mockResolvedValue({
      publishedAt: new Date('2026-05-12T12:00:00.000Z'),
      publishedByUser: { name: 'admin' },
      uploadBatch: {
        originalFileName: 'invoice-2026-05-10.jpg',
      },
      inventoryStatusChanges: [
        {
          previousStatus: 'PLENTIFUL',
          nextStatus: 'FEW_LEFT',
          changedAt: new Date('2026-05-12T12:02:00.000Z'),
          changedByUser: { name: 'admin' },
          product: { id: 'soup', name: 'スープ' },
        },
        {
          previousStatus: null,
          nextStatus: 'PLENTIFUL',
          changedAt: new Date('2026-05-12T12:01:00.000Z'),
          changedByUser: { name: 'admin' },
          product: { id: 'bread', name: '食パン' },
        },
      ],
    });
    inventoryStatusChangeFindMany.mockResolvedValue([
      {
        previousStatus: 'PLENTIFUL',
        nextStatus: 'SOLD_OUT',
        changedAt: new Date('2026-05-12T12:30:00.000Z'),
        changedByUser: { name: 'member' },
        product: { id: 'bread', name: '食パン' },
      },
    ]);

    await expect(
      getCurrentInventoryPublicationSummary('fridge-1'),
    ).resolves.toEqual({
      originalFileName: 'invoice-2026-05-10.jpg',
      publishedAt: '2026-05-12T12:00:00.000Z',
      publishedByName: 'admin',
      publicationChanges: [
        {
          productId: 'soup',
          productName: 'スープ',
          previousStatus: 'PLENTIFUL',
          nextStatus: 'FEW_LEFT',
          changedAt: '2026-05-12T12:02:00.000Z',
          changedByName: 'admin',
        },
        {
          productId: 'bread',
          productName: '食パン',
          previousStatus: null,
          nextStatus: 'PLENTIFUL',
          changedAt: '2026-05-12T12:01:00.000Z',
          changedByName: 'admin',
        },
      ],
      manualChangesAfterPublication: [
        {
          productId: 'bread',
          productName: '食パン',
          previousStatus: 'PLENTIFUL',
          nextStatus: 'SOLD_OUT',
          changedAt: '2026-05-12T12:30:00.000Z',
          changedByName: 'member',
        },
      ],
    });
  });

  it('returns null when no publication exists', async () => {
    inventoryPublicationFindFirst.mockResolvedValue(null);

    await expect(
      getCurrentInventoryPublicationSummary('fridge-1'),
    ).resolves.toBeNull();
    expect(inventoryStatusChangeFindMany).not.toHaveBeenCalled();
  });
});
