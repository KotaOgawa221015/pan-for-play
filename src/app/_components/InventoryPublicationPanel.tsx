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
}: {
  changes: InventoryPublicationChange[];
  emptyText: string;
}) {
  if (changes.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyText}</p>;
  }

  return (
    <ul className="grid gap-3">
      {changes.map((change) => (
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

        <div className="grid gap-6 lg:grid-cols-2">
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
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                納品書反映で変わった状態
              </h3>
              <span className="text-xs text-zinc-500">
                {summary.publicationChanges.length} 件
              </span>
            </div>
            <ChangeList
              changes={summary.publicationChanges}
              emptyText="この納品書反映では状態変更はありません。"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
