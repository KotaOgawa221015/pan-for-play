import type { InventoryStatus as PrismaInventoryStatus } from '@prisma/client';

export type ProductStatus = PrismaInventoryStatus;

export type Product = {
  id: string;
  name: string;
  count: number;
  status: ProductStatus;
  updatedAt: string;
};

const STATUS_CATALOG: Record<
  ProductStatus,
  { label: string; styles: { active: string; inactive: string; badge: string } }
> = {
  PLENTIFUL: {
    label: '十分',
    styles: {
      active: 'bg-emerald-500 text-white border-emerald-500',
      inactive: 'border-emerald-200 text-emerald-700 hover:border-emerald-400',
      badge: 'bg-emerald-50 text-emerald-700',
    },
  },
  FEW_LEFT: {
    label: '残りわずか',
    styles: {
      active: 'bg-amber-500 text-white border-amber-500',
      inactive: 'border-amber-200 text-amber-700 hover:border-amber-400',
      badge: 'bg-amber-50 text-amber-700',
    },
  },
  SOLD_OUT: {
    label: '売り切れ',
    styles: {
      active: 'bg-rose-500 text-white border-rose-500',
      inactive: 'border-rose-200 text-rose-700 hover:border-rose-400',
      badge: 'bg-rose-50 text-rose-700',
    },
  },
};

export const PRODUCT_STATUSES = Object.keys(STATUS_CATALOG) as ProductStatus[];

export const STATUS_LABELS = Object.fromEntries(
  PRODUCT_STATUSES.map((status) => [status, STATUS_CATALOG[status].label]),
) as Record<ProductStatus, string>;

export const STATUS_STYLES = Object.fromEntries(
  PRODUCT_STATUSES.map((status) => [status, STATUS_CATALOG[status].styles]),
) as Record<ProductStatus, { active: string; inactive: string; badge: string }>;

export function isProductStatus(value: string): value is ProductStatus {
  return value in STATUS_LABELS;
}
