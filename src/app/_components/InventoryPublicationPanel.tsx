'use client';

import { useState } from 'react';
import {
  STATUS_LABELS,
  type InventoryPublicationChange,
  type InventoryPublicationSummary,
} from '@/types/inventory';

type Props = {
  summary: InventoryPublicationSummary;
};

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function ChangeList({
  changes,
  emptyText,
  defaultLimit,
}: {
  changes: InventoryPublicationChange[];
  emptyText: string;
  defaultLimit?: number;
}) {
  const [showAll, setShowAll] = useState(false);

  if (changes.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyText}</p>;
  }

  const hasLimit = defaultLimit !== undefined && changes.length > defaultLimit;

  const displayedChanges =
    hasLimit && !showAll ? changes.slice(0, defaultLimit) : changes;

  return (
    <div className="space-y-3">
      <ul className="grid gap-3">
        {displayedChanges.map((change) => (
          <li
            key={`${change.productId}-${change.changedAt}-${change.nextStatus}`}
            className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-200"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {change.productName}
                </span>
                {' : '}
                {change.previousStatus
                  ? STATUS_LABELS[change.previousStatus]
                  : '未掲載'}
                {' から '}
                {STATUS_LABELS[change.nextStatus]}
              </span>
              <span className="text-xs text-zinc-500">
                {change.changedByName}・{formatDateTime(change.changedAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {hasLimit && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors focus:outline-none dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            {showAll
              ? '一部のみ表示する'
              : `すべて表示する (${changes.length}件)`}
          </button>
        </div>
      )}
    </div>
  );
}

export function InventoryPublicationPanel({ summary }: Props) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-400">
            Inventory Evidence
          </p>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            変更履歴
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {summary.publishedByName} が {formatDateTime(summary.publishedAt)}{' '}
            に 「{summary.originalFileName}」を公開
          </p>
        </div>

        {/* 変更箇所: grid を外し、1列のレイアウトにする */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              反映後の手動変更
            </h3>
            <span className="text-xs text-zinc-500">
              {summary.manualChangesAfterPublication.length} 件
            </span>
          </div>
          <ChangeList
            changes={summary.manualChangesAfterPublication}
            emptyText="この納品書反映後の手動変更はありません。"
            defaultLimit={10}
          />
        </div>
      </div>
    </section>
  );
}
