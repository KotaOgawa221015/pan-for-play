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
} as const;

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
  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
      <div className="mb-6 space-y-2">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          直近の読み取り履歴
        </h2>
        <p className="text-xs text-zinc-500">
          読み取り済み納品書の確認と、必要に応じた再公開をここで扱います。
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
                        <dt className="mb-1 text-zinc-400">最終公開</dt>
                        <dd>{formatDateTime(entry.lastPublishedAt)}</dd>
                      </div>
                      <div>
                        <dt className="mb-1 text-zinc-400">公開者</dt>
                        <dd>{entry.lastPublishedByName ?? '未公開'}</dd>
                      </div>
                      <div>
                        <dt className="mb-1 text-zinc-400">公開回数</dt>
                        <dd>{entry.publicationCount} 回</dd>
                      </div>
                      <div>
                        <dt className="mb-1 text-zinc-400">商品行数</dt>
                        <dd>{entry.lineCount} 行</dd>
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
                    {entry.publicationCount > 0 && !entry.isCurrent ? (
                      <button
                        type="button"
                        onClick={() => onReapply(entry.id)}
                        disabled={isBusy}
                        className="rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        この納品書を再公開する
                      </button>
                    ) : null}

                    {entry.isCurrent ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                        現在公開中
                      </span>
                    ) : null}

                    {entry.publicationCount === 0 ? (
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
