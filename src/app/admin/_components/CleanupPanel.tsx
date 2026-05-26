'use client';

import { useState } from 'react';
import {
  cleanupFridgesAction,
  cleanupUsersAction,
} from '@/features/admin/actions';

export function CleanupPanel() {
  const [isFridgeLoading, setIsFridgeLoading] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(false);

  const handleFridgeCleanup = async () => {
    const confirmed = window.confirm(
      '削除された冷蔵庫データ、および関連する納品書などの物理ファイルを完全に削除します。\nこの操作は取り消せません。実行しますか？',
    );
    if (!confirmed) return;

    setIsFridgeLoading(true);
    const result = await cleanupFridgesAction();
    setIsFridgeLoading(false);
    alert(result.message);
  };

  const handleUserCleanup = async () => {
    const confirmed = window.confirm(
      '退会したユーザーの個人情報をデータベースから物理削除します。\n（利用規約に基づき、過去の操作履歴は「削除済みユーザー」に引き継がれます）\nこの操作は取り消せません。実行しますか？',
    );
    if (!confirmed) return;

    setIsUserLoading(true);
    const result = await cleanupUsersAction();
    setIsUserLoading(false);
    alert(result.message);
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
      <div className="mb-6 space-y-2">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          データメンテナンス
        </h2>
        <p className="text-xs text-zinc-500">
          削除または退会したデータをデータベースから完全に消去し、ストレージ容量を解放します。
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={handleFridgeCleanup}
          disabled={isFridgeLoading}
          className="w-full rounded-xl border border-rose-300 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
        >
          {isFridgeLoading
            ? '冷蔵庫データクリーンアップ中...'
            : '冷蔵庫データのクリーンアップ'}
        </button>

        <button
          type="button"
          onClick={handleUserCleanup}
          disabled={isUserLoading}
          className="w-full rounded-xl border border-rose-300 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
        >
          {isUserLoading
            ? 'ユーザークリーンアップ中...'
            : '退会ユーザーのクリーンアップ'}
        </button>
      </div>
    </section>
  );
}
