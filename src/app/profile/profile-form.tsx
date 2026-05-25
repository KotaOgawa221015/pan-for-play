'use client';

import { useActionState, useState } from 'react';
import {
  deleteAccountAction,
  updateProfileAction,
} from '@/features/account/profile';

type Fridge = { id: string; name: string };

export function ProfileForm({
  user,
  fridges,
}: {
  user: { name?: string | null; favoriteFridgeId?: string | null };
  fridges: Fridge[];
}) {
  const [, pAction, pPending] = useActionState(updateProfileAction, null);

  const initialName = user.name || '';
  const initialFavoriteFridgeId = user.favoriteFridgeId || '';
  const [name, setName] = useState(initialName);
  const [favoriteFridgeId, setFavoriteFridgeId] = useState(
    initialFavoriteFridgeId,
  );
  const hasChanges =
    name.trim() !== initialName.trim() ||
    favoriteFridgeId !== initialFavoriteFridgeId;

  const handleDeleteAccount = async () => {
    if (confirm('本当に退会しますか？この操作は取り消せません。')) {
      await deleteAccountAction();
    }
  };

  return (
    <div className="space-y-12">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h2 className="font-semibold text-lg mb-6">基本情報</h2>
        <form action={pAction} className="flex flex-col gap-6">
          <div className="space-y-1">
            <label
              htmlFor="name"
              className="text-xs font-bold text-zinc-400 uppercase"
            >
              表示名
            </label>
            <input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="favoriteFridgeId"
              className="text-xs font-bold text-zinc-400 uppercase"
            >
              お気に入り冷蔵庫
            </label>
            <select
              id="favoriteFridgeId"
              name="favoriteFridgeId"
              value={favoriteFridgeId}
              onChange={(e) => setFavoriteFridgeId(e.target.value)}
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
            >
              <option value="">設定しない</option>
              {fridges.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={pPending || !hasChanges}
            className="bg-zinc-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-zinc-800 transition disabled:opacity-50"
          >
            保存する
          </button>
        </form>
      </div>
      <button
        type="button"
        onClick={handleDeleteAccount}
        className="bg-rose-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-rose-700 transition"
      >
        退会する
      </button>
    </div>
  );
}
