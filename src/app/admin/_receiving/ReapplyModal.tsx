'use client';

type Props = {
  isOpen: boolean;
  fileName: string | null;
  lines: Array<{ id: string; name: string; count: number }>;
  fridges: { id: string; name: string }[];
  selectedFridgeId: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSelectFridge: (fridgeId: string) => void;
  onSubmit: () => void;
};

export function ReapplyModal({
  isOpen,
  fileName,
  lines,
  fridges,
  selectedFridgeId,
  isSubmitting,
  onClose,
  onSelectFridge,
  onSubmit,
}: Props) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/65 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          再適用先を選択
        </h2>
        <p className="mt-2 text-xs text-zinc-500">
          {fileName ?? '選択中の納品書'} を再適用する冷蔵庫を選択します。
        </p>

        <ul className="mt-4 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          {lines.map((line) => (
            <li
              key={line.id}
              className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-2 last:border-b-0 last:pb-0 dark:border-zinc-700"
            >
              <span className="truncate">{line.name}</span>
              <span className="shrink-0 font-semibold">x{line.count}</span>
            </li>
          ))}
        </ul>

        <label className="mt-4 block space-y-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            冷蔵庫
          </span>
          <select
            value={selectedFridgeId}
            disabled={isSubmitting}
            onChange={(event) => onSelectFridge(event.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="" disabled>
              冷蔵庫を選択してください
            </option>
            {fridges.map((fridge) => (
              <option key={fridge.id} value={fridge.id}>
                {fridge.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            閉じる
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !selectedFridgeId}
            className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          >
            {isSubmitting ? '再適用中...' : '再適用する'}
          </button>
        </div>
      </div>
    </div>
  );
}
