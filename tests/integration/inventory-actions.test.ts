import { beforeEach, describe, expect, it, vi } from 'vitest';

const { uploadBatchFindFirst } = vi.hoisted(() => ({
  uploadBatchFindFirst: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    uploadBatch: {
      findFirst: uploadBatchFindFirst,
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
    uploadBatchFindFirst.mockReset();
  });

  it('loads products from the applied receiving batch', async () => {
    uploadBatchFindFirst.mockResolvedValue({
      appliedAt: new Date('2026-05-12T12:00:00.000Z'),
      processedAt: new Date('2026-05-12T11:00:00.000Z'),
      createdAt: new Date('2026-05-12T10:00:00.000Z'),
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
    });

    await expect(getInventoryProducts()).resolves.toEqual([
      {
        id: 'soup',
        name: 'スープ',
        category: 'SOUP',
        count: 4,
        status: 'FEW_LEFT',
        updatedAt: '2026-05-12T12:00:00.000Z',
      },
      {
        id: 'bread',
        name: '食パン',
        category: 'BREAD',
        count: 8,
        status: 'PLENTIFUL',
        updatedAt: '2026-05-12T12:00:00.000Z',
      },
    ]);

    expect(uploadBatchFindFirst).toHaveBeenCalledWith({
      where: {
        processingStatus: 'APPLIED',
      },
      orderBy: {
        appliedAt: 'desc',
      },
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
    });
  });

  it('hides zero-count lines and returns empty when no applied batch exists', async () => {
    uploadBatchFindFirst.mockResolvedValueOnce({
      appliedAt: new Date('2026-05-12T12:00:00.000Z'),
      processedAt: null,
      createdAt: new Date('2026-05-12T10:00:00.000Z'),
      lines: [
        {
          count: 0,
          matchedProduct: { id: 'bread', name: '食パン', category: 'BREAD' },
        },
      ],
    });

    await expect(getInventoryProducts()).resolves.toEqual([]);

    uploadBatchFindFirst.mockResolvedValueOnce(null);
    await expect(getInventoryProducts()).resolves.toEqual([]);
  });
});
