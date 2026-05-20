import type { ProductStatus } from '@/types/inventory';
import { z } from 'zod';

const inventoryCountSchema = z.number().int().min(0);

export function getProductStatusFromCount(count: number): ProductStatus {
  if (!inventoryCountSchema.safeParse(count).success) {
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
