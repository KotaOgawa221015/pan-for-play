'use client';

import { useActionState } from 'react';
import { updateProfileAction, deleteAccountAction } from '@/features/profile/profile-settings';



export function ProfileForm({ user }: { user: { name: string | null } }) {

  const [pState, pAction, pPending] = useActionState(updateProfileAction, null);

  const handleDeleteAccount = async () => {
    if (confirm("本当に退会しますか？この操作は取り消せません。")) {
      await deleteAccountAction();
    }
  };

  return (
    <div className="space-y-12">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h2 className="font-semibold text-lg mb-6">基本情報</h2>
        <form action={pAction} className="flex flex-col gap-6">
          <div className="space-y-1">

            <label htmlFor="name" className="text-xs font-bold text-zinc-400 uppercase">表示名</label>
            <input
              id="name"
              name="name"
              defaultValue={user.name || ''}

              className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
            />
          </div>
          <button type="submit" disabled={pPending} className="...">保存する</button>
        </form>
      </div>

      <div className="bg-rose-50 dark:bg-rose-950/20 p-6 rounded-xl border border-rose-100 dark:border-rose-900/50">
        <h2 className="font-semibold text-rose-800 dark:text-rose-400 text-lg mb-2">危険な操作</h2>
        <p className="text-sm text-rose-600 dark:text-rose-500 mb-6">
          退会すると、あなたのアカウント情報および関連するデータがすべて削除されます。
        </p>
        <button
          onClick={handleDeleteAccount}
          className="bg-rose-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-rose-700 transition"
        >
          退会する
        </button>
      </div>
    </div>
  );
}