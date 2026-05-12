import { describe, expect, it } from 'vitest';
import {
  PRODUCT_STATUSES,
  STATUS_LABELS,
  STATUS_STYLES,
  isProductStatus,
} from './inventory';

describe('inventory product statuses', () => {
  it('accepts every exported product status', () => {
    expect(PRODUCT_STATUSES.every(isProductStatus)).toBe(true);
  });

  it('rejects values outside the product status contract', () => {
    expect(isProductStatus('BACKORDERED')).toBe(false);
    expect(isProductStatus('')).toBe(false);
  });

  it('exposes presentation metadata for each status', () => {
    for (const status of PRODUCT_STATUSES) {
      expect(STATUS_LABELS[status]).toEqual(expect.any(String));
      expect(STATUS_STYLES[status]).toEqual({
        active: expect.any(String),
        inactive: expect.any(String),
        badge: expect.any(String),
      });
    }
  });
});
