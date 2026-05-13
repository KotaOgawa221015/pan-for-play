// src/app/_components/Header.tsx
import Link from 'next/link';
import { UserMenu } from '@/app/_components/UserMenu';

export function Header() {
    return (
        <header className="relative p-6 border-b bg-white dark:bg-zinc-950 dark:border-zinc-800">
            <div className="max-w-6xl mx-auto relative flex items-center justify-center min-h-16">
                <div className="flex flex-col items-center justify-center leading-none mt-1 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-lg">🍞</span>
                        <h1 className="font-semibold text-xl">パンコレ</h1>
                    </div>

                    <span className="text-[13.5px] text-zinc-500 font-mono uppercase tracking-widest">
                        ~冷凍庫のパンとスープ、いつでもひと目で~
                    </span>
                </div>
            </div>

            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
                <UserMenu />

                <Link
                    href="/admin"
                    className="bg-white text-xs font-medium px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 hover:border-zinc-900 hover:text-zinc-900 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shadow-sm"
                >
                    管理者用
                </Link>
            </div>
        </header>
    );
}