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
      '削除から30日以上が経過した冷蔵庫データ、および関連する納品書などの物理ファイルを完全に削除します。\nこの操作は取り消せません。実行しますか？',
    );
    if (!confirmed) return;

    setIsFridgeLoading(true);
    const result = await cleanupFridgesAction();
    setIsFridgeLoading(false);
    alert(result.message);
  };

  const handleUserCleanup = async () => {
    const confirmed = window.confirm(
      '退会から30日以上が経過したユーザーの個人情報をデータベースから物理削除します。\n（利用規約に基づき、過去の操作履歴は「削除済みユーザー」に引き継がれます）\nこの操作は取り消せません。実行しますか？',
    );
    if (!confirmed) return;

    setIsUserLoading(true);
    const result = await cleanupUsersAction();
    setIsUserLoading(false);
    alert(result.message);
  };

  return (
    <div className="mt-12 border-t pt-8 border-gray-200">
      <h3 className="text-lg font-bold text-gray-700 mb-4">
        データメンテナンス（管理者専用）
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        削除または退会から30日以上が経過した古いデータをデータベースから完全に消去し、ストレージ容量を解放します。
      </p>

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleFridgeCleanup}
          disabled={isFridgeLoading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium shadow disabled:bg-gray-400 transition"
        >
          {isFridgeLoading
            ? '冷蔵庫データクリーンアップ中...'
            : '冷蔵庫データのクリーンアップ'}
        </button>

        <button
          type="button"
          onClick={handleUserCleanup}
          disabled={isUserLoading}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium shadow disabled:bg-gray-400 transition"
        >
          {isUserLoading
            ? 'ユーザークリーンアップ中...'
            : '退会ユーザーのクリーンアップ'}
        </button>
      </div>
    </div>
  );
}
