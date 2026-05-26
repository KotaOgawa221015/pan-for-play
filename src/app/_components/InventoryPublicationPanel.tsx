'use client';

import { useState } from 'react';
import {
  type InventoryPublicationChange,
  type InventoryPublicationSummary,
  STATUS_LABELS,
} from '@/types/inventory';

type Props = {
  summary: InventoryPublicationSummary;
};

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Tokyo',
});

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function ChangeList({
  changes,
  emptyText,
  itemsPerPage = 10,
}: {
  changes: InventoryPublicationChange[];
  emptyText: string;
  itemsPerPage?: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);

  if (changes.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyText}</p>;
  }

  // ページング計算
  const totalPages = Math.max(1, Math.ceil(changes.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const displayedChanges = changes.slice(startIndex, startIndex + itemsPerPage);

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

      {/* ページネーションコントロール（複数ページある場合のみ表示） */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 pt-1">
          <p>
            {startIndex + 1}-
            {Math.min(startIndex + itemsPerPage, changes.length)} /{' '}
            {changes.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-full border border-zinc-300 dark:border-zinc-700 px-3 py-1 font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition"
            >
              前へ
            </button>
            <span className="text-zinc-600 dark:text-zinc-400">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={safeCurrentPage === totalPages}
              className="rounded-full border border-zinc-300 dark:border-zinc-700 px-3 py-1 font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition"
            >
              次へ
            </button>
          </div>
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
            itemsPerPage={10}
          />
        </div>
      </div>
    </section>
  );
}
