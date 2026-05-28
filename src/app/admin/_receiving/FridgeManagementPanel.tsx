'use client';

import { useState, useTransition } from 'react';
import {
  createFridge,
  deleteFridge,
  renameFridge,
} from '@/features/fridge/actions';

type Fridge = {
  id: string;
  name: string;
  isDefault: boolean;
};

type Props = {
  fridges: Fridge[];
};

export function FridgeManagementPanel({ fridges }: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string>('');
  const [renameName, setRenameName] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const selectedFridge = fridges.find((f) => f.id === selectedId);

  const handleSelectChange = (id: string) => {
    setSelectedId(id);
    const fridge = fridges.find((f) => f.id === id);
    setRenameName(fridge ? fridge.name : '');
    setMessage(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setMessage(null);
    startTransition(async () => {
      try {
        const result = await createFridge(newName);
        if (result.success) {
          setMessage({
            type: 'success',
            text: `冷蔵庫「${newName}」を追加しました。`,
          });
          setNewName('');
        }
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof Error ? err.message : '追加に失敗しました。',
        });
      }
    });
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !renameName.trim()) return;

    setMessage(null);
    startTransition(async () => {
      try {
        const result = await renameFridge({ id: selectedId, name: renameName });
        if (result.success) {
          setMessage({ type: 'success', text: '冷蔵庫名を変更しました。' });
        }
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof Error ? err.message : '変更に失敗しました。',
        });
      }
    });
  };

  const handleDelete = () => {
    if (!selectedId || !selectedFridge) return;
    if (selectedFridge.isDefault) return;

    if (
      !confirm(
        `本当に「${selectedFridge.name}」を削除しますか？\n削除すると、この冷蔵庫は選択肢に表示されなくなり、お気に入り登録者はデフォルト冷蔵庫に切り替わります。`,
      )
    ) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      try {
        const result = await deleteFridge(selectedId);
        if (result.success) {
          alert(`冷蔵庫「${selectedFridge.name}」を削除しました。`);
          setMessage({
            type: 'success',
            text: `冷蔵庫「${selectedFridge.name}」を削除しました。`,
          });
          setSelectedId('');
          setRenameName('');
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : '削除に失敗しました。');
        setMessage({
          type: 'error',
          text: err instanceof Error ? err.message : '削除に失敗しました。',
        });
      }
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-6">
        冷蔵庫管理
      </h2>

      {message && (
        <div
          className={`p-4 mb-6 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="fridge-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              編集・削除したい冷蔵庫を選択
            </label>
            <div className="relative w-full">
              <select
                id="fridge-select"
                value={selectedId}
                onChange={(e) => handleSelectChange(e.target.value)}
                disabled={isPending}
                className="block w-full appearance-none rounded-md border border-gray-300 bg-white pl-3 pr-10 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              >
                <option value="">-- 冷蔵庫を選択してください --</option>
                {fridges.map((fridge) => (
                  <option key={fridge.id} value={fridge.id}>
                    {fridge.name} {fridge.isDefault ? '（デフォルト）' : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <title>展開</title>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {selectedFridge && (
            <form onSubmit={handleRename} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="rename-input"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  変更後の名前を入力
                </label>
                <input
                  id="rename-input"
                  type="text"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  disabled={isPending}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                />
              </div>

              <div className="flex gap-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending || selectedFridge.isDefault}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  aria-label="選択中の冷蔵庫を削除"
                  title={
                    selectedFridge.isDefault
                      ? 'デフォルトの冷蔵庫は削除できません'
                      : '冷蔵庫を削除'
                  }
                >
                  削除
                </button>

                <button
                  type="submit"
                  disabled={
                    isPending ||
                    !renameName.trim() ||
                    renameName === selectedFridge.name
                  }
                  className="flex-1 justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                  aria-label="冷蔵庫の名前を変更"
                >
                  名前を変更
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label
                htmlFor="new-fridge-input"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                新しい冷蔵庫の追加
              </label>
              <input
                id="new-fridge-input"
                type="text"
                placeholder="例: 2F 奥側冷蔵庫"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={isPending}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || !newName.trim()}
              className="w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              aria-label="新しい冷蔵庫を追加"
            >
              新規追加
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
