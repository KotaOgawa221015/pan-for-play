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
    <>
      <style jsx global>{`
        @media print {
          html, body {
            height: 100%;
            margin: 0;
          }
          /* 中央寄せ: 印刷時にページ中央に固定表示 */
          .print-center {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            margin: 0 !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-zinc-950 print:bg-white print:p-0">
        <div className="mx-auto flex max-w-sm flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 print:border-none print:shadow-none print:p-0 print-center">
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

          <div className="flex flex-col items-center gap-5 py-6 text-center print:py-0">
            <div className="space-y-1.5">
              <h1 className="text-3xl font-semibold tracking-wide text-zinc-900 dark:text-zinc-50">
                Pan for PLAY
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Pan for PLAYの在庫を確認するアプリ
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                Site URL
              </p>
              <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
                {siteUrl || 'Loading...'}
              </p>
            </div>

            <div className="rounded-[2rem] border-4 border-zinc-200 bg-white p-6 dark:border-zinc-800 print:border-zinc-200">
              {siteUrl ? (
                <QRCodeSVG value={siteUrl} size={160} level="H" />
              ) : (
                <div className="h-[160px] w-[160px] animate-pulse rounded-[1.5rem] bg-zinc-100 dark:bg-zinc-800" />
              )}
            </div>

            <div className="space-y-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <p>【在庫表示の目安】</p>
              <p>十分：6個以上</p>
              <p>わずか：1〜5個</p>
              <p>完売：0個</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
