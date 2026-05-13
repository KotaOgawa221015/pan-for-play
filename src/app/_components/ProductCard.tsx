'use client';

import { useOptimistic, useTransition } from 'react';
import Image from 'next/image';
import { updateProductStatus } from '@/features/inventory/product-inventory';
import {
  PRODUCT_STATUSES,
  STATUS_LABELS,
  STATUS_STYLES,
  type Product,
  type ProductStatus,
} from '@/types/inventory';

type Props = {
  product: Product;
};

function formatRelativeTime(value: string): string {
  const updatedAt = new Date(value).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - updatedAt);
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}週間前`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}か月前`;

  const years = Math.floor(days / 365);
  return `${years}年前`;
}

export function ProductCard({ product }: Props) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    product.status,
    (_current, next: ProductStatus) => next,
  );
  const [isPending, startTransition] = useTransition();
  const updatedLabel = formatRelativeTime(product.updatedAt);

  const handleStatusChange = (nextStatus: ProductStatus) => {
    if (nextStatus === optimisticStatus) return;

    setOptimisticStatus(nextStatus);
    startTransition(async () => {
      try {
        await updateProductStatus(product.id, nextStatus);
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    });
  };

  const isSoldOut = STATUS_LABELS[optimisticStatus] === '売り切れ';

  const isSoup =
    product.name.includes('スープ') ||
    product.name === 'ミネストローネ' ||
    product.name === 'クラムチャウダー';

  const iconSrc = isSoup ? '/soup.png' : '/bread.png';

  return (
    <div
      className={`flex flex-col h-full p-4 bg-white rounded-2xl border border-zinc-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 transition-all hover:-translate-y-1 hover:shadow-lg ${
        isSoldOut ? 'opacity-50 grayscale' : ''
      }`}
    >
      <div className="flex items-center justify-center gap-2.5 h-10 mb-1.5 overflow-hidden px-1">
        <Image
          src={iconSrc}
          alt=""
          width={36}
          height={36}
          className="shrink-0 object-contain"
          unoptimized
        />
        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 truncate text-center">
          {product.name}
        </h3>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-1 h-10 mb-2">
        <span
          className={`px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider shrink-0 ${
            STATUS_STYLES[optimisticStatus].badge
          }`}
        >
          {STATUS_LABELS[optimisticStatus]}
        </span>
        <span className="text-[10px] text-zinc-400 font-medium mt-1 whitespace-nowrap">
          最終更新 {isPending ? '更新中...' : updatedLabel}
        </span>
      </div>

      <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
        {PRODUCT_STATUSES.map((status) => {
          const isActive = optimisticStatus === status;
          const styles = STATUS_STYLES[status];

          return (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusChange(status)}
              disabled={isPending}
              aria-pressed={isActive}
              className={`flex-1 rounded-full border px-2 py-1.5 text-[11px] font-bold transition-all ${
                isActive ? styles.active : styles.inactive
              } ${isPending ? 'opacity-70' : 'hover:scale-105 active:scale-95'}`}
            >
              {STATUS_LABELS[status]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
