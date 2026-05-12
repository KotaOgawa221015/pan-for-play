export const PRODUCT_STATUSES = ["PLENTIFUL", "FEW_LEFT", "SOLD_OUT"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export type Product = {
  id: string;
  name: string;
  status: ProductStatus;
  updatedAt: string;
};

export const STATUS_LABELS: Record<ProductStatus, string> = {
  PLENTIFUL: "十分",
  FEW_LEFT: "残りわずか",
  SOLD_OUT: "売り切れ",
};

export const STATUS_STYLES: Record<
  ProductStatus,
  { active: string; inactive: string; badge: string }
> = {
  PLENTIFUL: {
    active: "bg-emerald-500 text-white border-emerald-500",
    inactive: "border-emerald-200 text-emerald-700 hover:border-emerald-400",
    badge: "bg-emerald-50 text-emerald-700",
  },
  FEW_LEFT: {
    active: "bg-amber-500 text-white border-amber-500",
    inactive: "border-amber-200 text-amber-700 hover:border-amber-400",
    badge: "bg-amber-50 text-amber-700",
  },
  SOLD_OUT: {
    active: "bg-rose-500 text-white border-rose-500",
    inactive: "border-rose-200 text-rose-700 hover:border-rose-400",
    badge: "bg-rose-50 text-rose-700",
  },
};

export function isProductStatus(value: string): value is ProductStatus {
  return PRODUCT_STATUSES.includes(value as ProductStatus);
}
