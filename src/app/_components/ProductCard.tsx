'use client';

import { ProductCategory } from '@prisma/client';
import Image from 'next/image';
import { useEffect, useOptimistic, useState, useTransition } from 'react';
import { updateProductStatus } from '@/features/inventory/actions';
import {
  PRODUCT_STATUSES,
  type Product,
  type ProductStatus,
  STATUS_LABELS,
  STATUS_STYLES,
} from '@/types/inventory';

type Props = {
  product: Product & { lastPublishedAt?: string };
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
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(`soldout-alert-${product.id}`) === 'true') {
      setShowAlert(true);
    }
  }, [product.id]);

  const changedLabel = product.lastStatusChangedAt
    ? formatRelativeTime(product.lastStatusChangedAt)
    : null;

  const iconSrc =
    product.category === ProductCategory.SOUP
      ? '/category-icons/soup.png'
      : '/category-icons/bread.png';

  const handleStatusChange = (nextStatus: ProductStatus) => {
    if (nextStatus === optimisticStatus) {
      return;
    }

    if (nextStatus === 'SOLD_OUT') {
      setShowAlert(true);
      sessionStorage.setItem(`soldout-alert-${product.id}`, 'true');
    } else {
      setShowAlert(false);
      sessionStorage.removeItem(`soldout-alert-${product.id}`);
    }

    startTransition(async () => {
      setOptimisticStatus(nextStatus);

      try {
        await updateProductStatus(product.id, nextStatus);
      } catch (error) {
        console.error('Failed to update product status:', error);
      }
    });
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
    sessionStorage.removeItem(`soldout-alert-${product.id}`);
  };

  return (
    <>
      <div
        className={`flex flex-col h-full p-4 rounded-2xl border shadow-sm transition-all duration-300 ${
          optimisticStatus === 'SOLD_OUT'
            ? 'bg-zinc-100 border-zinc-200 opacity-60 grayscale dark:bg-zinc-900/50 dark:border-zinc-800'
            : 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'
        }`}
      >
        <div className="flex items-center justify-center gap-2.5 h-10 mb-1.5 overflow-hidden px-1">
          <Image
            src={iconSrc}
            alt=""
            width={36}
            height={36}
            className="shrink-0 object-contain size-9"
            priority
            unoptimized
          />
          <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 truncate text-center">
            {product.name}
          </h3>
        </div>

        <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-1 min-h-10 mb-2">
          <span
            className={`px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider shrink-0 ${
              STATUS_STYLES[optimisticStatus].badge
            }`}
          >
            {STATUS_LABELS[optimisticStatus]}
          </span>

          {isPending ? (
            <span className="text-[10px] text-zinc-400 font-medium mt-1 whitespace-nowrap">
              更新中...
            </span>
          ) : changedLabel && product.lastStatusChangedByName ? (
            <span className="text-[10px] text-zinc-400 font-medium mt-1 whitespace-nowrap">
              状態変更 {product.lastStatusChangedByName}・{changedLabel}
            </span>
          ) : product.lastPublishedAt ? (
            <span className="text-[10px] text-zinc-400 font-medium mt-1 whitespace-nowrap">
              納品書反映・{formatRelativeTime(product.lastPublishedAt)}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex gap-2">
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
                className={`flex-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition ${
                  isActive ? styles.active : styles.inactive
                } ${isPending ? 'opacity-70' : ''}`}
              >
                {STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>
      </div>

      {showAlert && (
        <button
          type="button"
          onClick={handleCloseAlert}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm cursor-pointer rounded-xl border border-zinc-200 bg-white p-4 shadow-xl transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700/80"
        >
          <p className="text-center text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
            <span className="font-bold">「{product.name}」</span>
            を売り切れにしました。
            <br />
            一覧の下部に移動しました。
          </p>
        </button>
      )}
    </>
  );
}
