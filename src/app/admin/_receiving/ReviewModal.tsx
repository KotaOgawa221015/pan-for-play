'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  ReviewDraft,
  ReviewInput,
  ReviewLine,
} from '@/features/receiving/types';

type Props = {
  draft: ReviewDraft | null;
  isApplying: boolean;
  onApply: (input: ReviewInput) => Promise<void>;
  onClose: () => void;
};

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function formatCountStatus(count: number) {
  if (count <= 0) {
    return '非表示';
  }

  if (count <= 5) {
    return '残り少し';
  }

  return '十分に残っている';
}

export function ReviewModal({ draft, isApplying, onApply, onClose }: Props) {
  const [products, setProducts] = useState<ReviewLine[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setProducts(draft?.products ?? []);
    setErrorMessage(null);
  }, [draft]);

  const catalogById = useMemo(
    () => new Map(draft?.catalog.map((product) => [product.id, product]) ?? []),
    [draft],
  );

  const validationMessage = useMemo(() => {
    const seen = new Set<string>();

    for (const product of products) {
      const name = normalizeName(product.name);

      if (!name) {
        return '商品名が空の行があります。';
      }

      if (!Number.isInteger(product.count) || product.count <= 0) {
        return `数量は 1 以上の整数で入力してください: ${name}`;
      }

      const resolvedName = product.selectedProductId
        ? normalizeName(
            catalogById.get(product.selectedProductId)?.name ?? product.name,
          )
        : name;

      if (seen.has(resolvedName)) {
        return `同じ商品が複数回含まれています: ${resolvedName}`;
      }

      seen.add(resolvedName);
    }

    return null;
  }, [catalogById, products]);

  if (!draft) {
    return null;
  }

  const handleProductChange = (
    lineId: string,
    updater: (product: ReviewLine) => ReviewLine,
  ) => {
    setProducts((current) =>
      current.map((product) =>
        product.lineId === lineId ? updater(product) : product,
      ),
    );
  };

  const handleApply = async () => {
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setErrorMessage(null);

    try {
      await onApply({
        batchId: draft.batchId,
        products: products.map((product) => ({
          lineId: product.lineId,
          name: normalizeName(product.name),
          count: product.count,
          selectedProductId: product.selectedProductId,
        })),
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '納品書の適用に失敗しました。',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/65 p-4">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">
              Delivery Note Review
            </p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {draft.originalFileName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isApplying}
            className="rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 disabled:opacity-50"
          >
            閉じる
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 text-sm text-zinc-600 dark:text-zinc-300">
            商品名と数量を確認して、既存商品への紐付けまたは新規商品登録を確定します。
          </div>

          {validationMessage || errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage ?? validationMessage}
            </div>
          ) : null}

          <div className="space-y-4">
            {products.map((product, index) => {
              const selectedProductName = product.selectedProductId
                ? (catalogById.get(product.selectedProductId)?.name ?? null)
                : null;

              return (
                <section
                  key={product.lineId}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">
                        Line {index + 1}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        状態: {formatCountStatus(product.count)}
                      </p>
                    </div>
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                      {selectedProductName
                        ? `既存商品: ${selectedProductName}`
                        : '新しい商品として登録'}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_120px_minmax(0,1.2fr)]">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold text-zinc-500">
                        商品名
                      </span>
                      <input
                        type="text"
                        value={product.name}
                        disabled={isApplying}
                        onChange={(event) =>
                          handleProductChange(product.lineId, (current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold text-zinc-500">
                        数量
                      </span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={product.count}
                        disabled={isApplying}
                        onChange={(event) =>
                          handleProductChange(product.lineId, (current) => ({
                            ...current,
                            count: Number(event.target.value),
                          }))
                        }
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold text-zinc-500">
                        紐付け先
                      </span>
                      <select
                        value={product.selectedProductId ?? ''}
                        disabled={isApplying}
                        onChange={(event) =>
                          handleProductChange(product.lineId, (current) => ({
                            ...current,
                            selectedProductId: event.target.value || null,
                          }))
                        }
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100"
                      >
                        <option value="">新しい商品として登録</option>
                        {draft.catalog.map((catalogProduct) => (
                          <option
                            key={catalogProduct.id}
                            value={catalogProduct.id}
                          >
                            {catalogProduct.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800 px-6 py-5">
          <p className="text-sm text-zinc-500">
            {products.length} 件の読取結果をレビュー中
          </p>
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying || Boolean(validationMessage)}
            className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isApplying ? '反映中...' : '内容を反映する'}
          </button>
        </div>
      </div>
    </div>
  );
}
