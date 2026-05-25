'use client';

import { useState } from 'react';
import type { HistoryEntry } from '@/features/receiving/types';

type Props = {
  entries: HistoryEntry[];
  busyBatchId: string | null;
  onReapply: (batchId: string) => void;
  onDelete: (batchId: string) => void;
};

const ENTRIES_PER_PAGE = 5;

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Tokyo',
});

function formatDateTime(value: string | null) {
  if (!value) {
    return '未実行';
  }

  return dateTimeFormatter.format(new Date(value));
}

export function HistoryList({
  entries,
  busyBatchId,
  onReapply,
  onDelete,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(entries.length / ENTRIES_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ENTRIES_PER_PAGE;
  const pagedEntries = entries.slice(startIndex, startIndex + ENTRIES_PER_PAGE);

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
      <div className="mb-6 space-y-2">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          直近の読み取り履歴
        </h2>
        <p className="text-xs text-zinc-500">
          読み取り済み納品書の確認と、必要に応じた再適用をここで扱います。
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-400">まだ履歴はありません。</p>
      ) : (
        <div className="space-y-4">
          {pagedEntries.map((entry) => {
            const isBusy = busyBatchId === entry.id;

            return (
              <article
                key={entry.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 bg-zinc-50/70 dark:bg-zinc-950/50"
              >
                <div className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {entry.originalFileName}
                      </h3>
                    </div>

                    <dl className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <dt className="text-zinc-400">作成</dt>
                        <dd>{formatDateTime(entry.createdAt)}</dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <dt className="text-zinc-400">適用中</dt>
                        <dd>
                          {entry.appliedFridgeNames.length > 0
                            ? entry.appliedFridgeNames.join('、')
                            : '未適用'}
                        </dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <dt className="text-zinc-400">公開者</dt>
                        <dd>{entry.lastPublishedByName ?? '未公開'}</dd>
                      </div>
                    </dl>

                    <ul className="flex flex-wrap gap-2">
                      {entry.lines.map((line) => (
                        <li
                          key={line.id}
                          className="rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-[11px] text-zinc-600 dark:text-zinc-300"
                        >
                          {line.name} x{line.count}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-row flex-nowrap items-center gap-2">
                    {entry.hasPublication ? (
                      <button
                        type="button"
                        onClick={() => onReapply(entry.id)}
                        disabled={isBusy}
                        className="whitespace-nowrap rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        再適用
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => onDelete(entry.id)}
                      disabled={isBusy}
                      className="whitespace-nowrap rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {entries.length > ENTRIES_PER_PAGE ? (
            <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
              <p>
                {startIndex + 1}-
                {Math.min(startIndex + ENTRIES_PER_PAGE, entries.length)} /{' '}
                {entries.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
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
          ) : null}
        </div>
      )}
    </section>
  );
}
