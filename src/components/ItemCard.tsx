'use client';

import { useOptimistic, useTransition } from 'react';
import { updateItemStatus } from '@/app/actions';
import {
  ITEM_STATUSES,
  STATUS_LABELS,
  STATUS_STYLES,
  type InventoryItem,
  type ItemStatus,
} from '@/types/inventory';

type Props = {
  item: InventoryItem;
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

export function ItemCard({ item }: Props) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    item.status,
    (_current, next: ItemStatus) => next,
  );
  const [isPending, startTransition] = useTransition();
  const updatedLabel = formatRelativeTime(item.updatedAt);

  const handleStatusChange = (nextStatus: ItemStatus) => {
    if (nextStatus === optimisticStatus) return;

    setOptimisticStatus(nextStatus);
    startTransition(async () => {
      try {
        await updateItemStatus(item.id, nextStatus);
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    });
  };

  return (
    <div className="flex flex-col justify-between p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm dark:bg-zinc-800 dark:border-zinc-700 aspect-square">
      <div className="space-y-2">
        <div className="text-center font-medium text-zinc-900 dark:text-zinc-100">
          {item.name}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px]">
          <span
            className={`px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[optimisticStatus].badge
              }`}
          >
            {STATUS_LABELS[optimisticStatus]}
          </span>
          <span className="text-zinc-400">
            最終更新 {isPending ? '更新中...' : updatedLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {ITEM_STATUSES.map((status) => {
          const isActive = optimisticStatus === status;
          const styles = STATUS_STYLES[status];

          return (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusChange(status)}
              disabled={isPending}
              aria-pressed={isActive}
              className={`flex-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition ${isActive ? styles.active : styles.inactive
                } ${isPending ? 'opacity-70' : ''}`}
            >
              {STATUS_LABELS[status]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
