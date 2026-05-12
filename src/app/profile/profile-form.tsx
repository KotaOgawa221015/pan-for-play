'use client';

import { useActionState } from 'react';
import { updateProfileAction, updatePasswordAction } from '@/app/actions';

export function ProfileForm({ user }: { user: any }) {
    const [pState, pAction, pPending] = useActionState(updateProfileAction, null);
    const [passState, passAction, passPending] = useActionState(updatePasswordAction, null);

    return (
        <div className="space-y-6">
            {/* 基本情報変更 */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                <h2 className="font-bold text-lg">基本情報</h2>
                <form action={pAction} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-400 uppercase">表示名</label>
                        <input
                            name="displayName"
                            defaultValue={user.displayName || ''}
                            className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-400 uppercase">メールアドレス</label>
                        <input
                            name="email"
                            type="email"
                            defaultValue={user.email}
                            className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                        />
                    </div>
                    <button
                        disabled={pPending}
                        className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
                    >
                        {pPending ? '保存中...' : '基本情報を保存'}
                    </button>
                    {pState?.success && <p className="text-green-600 text-xs font-bold">{pState.success}</p>}
                    {pState?.error && <p className="text-red-600 text-xs font-bold">{pState.error}</p>}
                </form>
            </div>

            {/* パスワード変更 */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                <h2 className="font-bold text-lg text-red-600">セキュリティ</h2>
                <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase">現在のパスワード</label>
                    <div className="text-zinc-500 font-mono py-2">********</div>
                </div>

                <form action={passAction} className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-400 uppercase">新しいパスワード</label>
                        <input
                            name="newPassword"
                            type="password"
                            placeholder="6文字以上"
                            className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                        />
                    </div>
                    <button
                        disabled={passPending}
                        className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition disabled:opacity-50"
                    >
                        {passPending ? '変更中...' : 'パスワードを変更する'}
                    </button>
                    {passState?.success && <p className="text-green-600 text-xs font-bold">{passState.success}</p>}
                    {passState?.error && <p className="text-red-600 text-xs font-bold">{passState.error}</p>}
                </form>
            </div>
        </div>
    );
}