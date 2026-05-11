'use client';

import { useState } from 'react';
import { logoutAction } from '@/app/actions';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* ユーザーアイコンボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white p-2 border border-zinc-300 text-zinc-500 hover:text-zinc-800 hover:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-full hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
        aria-label="ユーザーメニュー"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>ユーザーメニュー</title>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute right-0 pt-2 w-32 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg py-1">
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
