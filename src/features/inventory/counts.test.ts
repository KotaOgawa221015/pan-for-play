import { describe, expect, it } from 'vitest';
import {
  getProductStatusFromCount,
  getRepresentativeCountForStatus,
} from './counts';

describe('inventory counts', () => {
  it('derives product status from count', () => {
    expect(getProductStatusFromCount(0)).toBe('SOLD_OUT');
    expect(getProductStatusFromCount(1)).toBe('FEW_LEFT');
    expect(getProductStatusFromCount(5)).toBe('FEW_LEFT');
    expect(getProductStatusFromCount(6)).toBe('PLENTIFUL');
  });

  it('maps manual status updates to representative counts', () => {
    expect(getRepresentativeCountForStatus('SOLD_OUT')).toBe(0);
    expect(getRepresentativeCountForStatus('FEW_LEFT')).toBe(5);
    expect(getRepresentativeCountForStatus('PLENTIFUL')).toBe(6);
  });
});
