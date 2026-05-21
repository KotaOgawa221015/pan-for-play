'use client';

import { useTransition, useState } from 'react'; // ✨ useState を追加
import {
  promoteToAdmin,
  demoteFromAdmin,
} from '@/features/account/admin-management';
import { UserRole } from '@prisma/client';

type EligibleUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type Props = {
  users: EligibleUser[];
  currentAdminId: string;
};

export function UserManagementPanel({ users, currentAdminId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const handlePromote = (userId: string, userName: string) => {
    if (!confirm(`本当に ${userName} を管理者に昇格させますか？`)) return;

    startTransition(async () => {
      try {
        const result = await promoteToAdmin(userId);
        if (result?.success) alert(`${userName} を管理者に昇格しました。`);
      } catch (error) {
        alert(
          error instanceof Error ? error.message : 'エラーが発生しました。',
        );
      }
    });
  };

  const handleDemote = (userId: string, userName: string) => {
    if (
      !confirm(
        `本当に ${userName} の管理者権限を剥奪しますか？\n一般ユーザーに格下げされます。`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await demoteFromAdmin(userId);
        if (result?.success) alert(`${userName} の管理者権限を剥奪しました。`);
      } catch (error) {
        alert(
          error instanceof Error ? error.message : 'エラーが発生しました。',
        );
      }
    });
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
      <div className="mb-6 space-y-2">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          ユーザー権限管理
        </h2>
        <p className="text-xs text-zinc-500">
          メンバーの管理者への昇格、および管理者権限の剥奪を行えます。
        </p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="名前またはメールアドレスで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition"
        />
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {filteredUsers.length === 0 ? (
          <p className="text-sm text-zinc-400 py-3 text-center">
            該当するユーザーが見つかりません。
          </p>
        ) : (
          filteredUsers.map((user) => {
            const isAdmin = user.role === UserRole.ADMIN;
            const isSelf = user.id === currentAdminId;

            return (
              <div
                key={user.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {user.name}{' '}
                    {isSelf && (
                      <span className="text-xs text-zinc-400">（あなた）</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <>
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        管理者
                      </span>
                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => handleDemote(user.id, user.name)}
                          disabled={isPending}
                          className="rounded-full border border-rose-300 dark:border-rose-700 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-50 transition"
                        >
                          権限を剥奪
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePromote(user.id, user.name)}
                      disabled={isPending}
                      className="rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition"
                    >
                      管理者に昇格
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
