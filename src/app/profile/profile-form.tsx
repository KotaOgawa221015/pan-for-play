'use client';

import { useActionState, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  updateProfileAction,
  deleteAccountAction,
} from '@/features/profile/profile-settings';

export function ProfileForm({ user }: { user: { name?: string | null } }) {
  const [state, pAction, pPending] = useActionState(updateProfileAction, null);

  const { update } = useSession();
  const [name, setName] = useState(user.name || '');

  useEffect(() => {
    if (state?.success) {
      update({ name: name.trim() });
    }
  }, [state, update, name]);

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
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={pPending}
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
