import type { ProductStatus } from '@/types/inventory';

export function getProductStatusFromCount(count: number): ProductStatus {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`Invalid inventory count: ${count}`);
  }

  if (count === 0) {
    return 'SOLD_OUT';
  }

  if (count <= 5) {
    return 'FEW_LEFT';
  }

  return 'PLENTIFUL';
}

export function getRepresentativeCountForStatus(status: ProductStatus): number {
  switch (status) {
    case 'SOLD_OUT':
      return 0;
    case 'FEW_LEFT':
      return 5;
    case 'PLENTIFUL':
      return 6;
  }
}
