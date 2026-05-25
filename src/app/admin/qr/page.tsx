'use client';

import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

export default function QRPage() {
  const [siteUrl, setSiteUrl] = useState('');

  useEffect(() => {
    setSiteUrl(window.location.origin);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-zinc-950 print:bg-white print:p-0">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 print:border-none print:shadow-none print:p-0">
        <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800 print:hidden">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
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
              <title>戻る</title>
              <path d="m15 18-6-6 6-6" />
            </svg>
            管理画面に戻る
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            PDFとして保存 / 印刷
          </button>
        </div>

        <div className="flex flex-col items-center gap-6 py-8 text-center print:py-0">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-wide text-zinc-900 dark:text-zinc-50">
              Pancolle
            </h1>
            <p className="text-base text-zinc-500 dark:text-zinc-400">
              在庫ステータスボード
            </p>
          </div>

          <p className="max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
            以下のQRコードをスキャンすると、現在のサイトに直接アクセスできます。
          </p>

          <div className="rounded-[2rem] border-4 border-zinc-200 bg-white p-8 dark:border-zinc-800 print:border-zinc-200">
            {siteUrl ? (
              <QRCodeSVG value={siteUrl} size={256} level="H" />
            ) : (
              <div className="h-[256px] w-[256px] animate-pulse rounded-[1.5rem] bg-zinc-100 dark:bg-zinc-800" />
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Site URL
            </p>
            <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
              {siteUrl || 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
