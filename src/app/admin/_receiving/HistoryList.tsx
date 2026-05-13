'use client';

import type { HistoryEntry } from '@/features/receiving/types';

type Props = {
  entries: HistoryEntry[];
  busyBatchId: string | null;
  onReapply: (batchId: string) => void;
  onDelete: (batchId: string) => void;
};

const STATUS_LABELS = {
  PENDING: '処理待ち',
  PROCESSED: 'レビュー待ち',
  FAILED: '失敗',
  APPLIED: '適用済み',
  REVERTED: '過去の反映',
} as const;

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  dateStyle: 'medium',
  timeStyle: 'short',
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
  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
      <div className="mb-6 space-y-2">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          直近の読み取り履歴
        </h2>
        <p className="text-xs text-zinc-500">
          反映内容の確認と、必要に応じた在庫の入れ替えをここで扱います。
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-400">まだ履歴はありません。</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const isBusy = busyBatchId === entry.id;

            return (
              <article
                key={entry.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 bg-zinc-50/70 dark:bg-zinc-950/50"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {entry.originalFileName}
                      </h3>
                      <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                        {STATUS_LABELS[entry.processingStatus]}
                      </span>
                    </div>

                    <dl className="grid gap-2 text-xs text-zinc-500 sm:grid-cols-2">
                      <div>
                        <dt className="mb-1 text-zinc-400">作成</dt>
                        <dd>{formatDateTime(entry.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="mb-1 text-zinc-400">最終適用</dt>
                        <dd>{formatDateTime(entry.appliedAt)}</dd>
                      </div>
                      <div>
                        <dt className="mb-1 text-zinc-400">現役終了</dt>
                        <dd>{formatDateTime(entry.revertedAt)}</dd>
                      </div>
                      <div>
                        <dt className="mb-1 text-zinc-400">
                          現在反映されている行数
                        </dt>
                        <dd>{entry.appliedLineCount} 行</dd>
                      </div>
                    </dl>

                    <ul className="flex flex-wrap gap-2">
                      {entry.lines.slice(0, 6).map((line) => (
                        <li
                          key={line.id}
                          className="rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-[11px] text-zinc-600 dark:text-zinc-300"
                        >
                          {line.name} x{line.count}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {entry.revertedAt ? (
                      <button
                        type="button"
                        onClick={() => onReapply(entry.id)}
                        disabled={isBusy}
                        className="rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        この納品書の商品に入れ替える
                      </button>
                    ) : null}

                    {entry.processingStatus === 'APPLIED' ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                        現在反映中
                      </span>
                    ) : null}

                    {entry.processingStatus !== 'APPLIED' ? (
                      <button
                        type="button"
                        onClick={() => onDelete(entry.id)}
                        disabled={isBusy}
                        className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                      >
                        削除
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
