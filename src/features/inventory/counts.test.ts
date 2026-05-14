import { describe, expect, it } from 'vitest';
import { getProductStatusFromCount } from './counts';

describe('inventory counts', () => {
  it('derives product status from count', () => {
    expect(getProductStatusFromCount(0)).toBe('SOLD_OUT');
    expect(getProductStatusFromCount(1)).toBe('FEW_LEFT');
    expect(getProductStatusFromCount(5)).toBe('FEW_LEFT');
    expect(getProductStatusFromCount(6)).toBe('PLENTIFUL');
  });
});
