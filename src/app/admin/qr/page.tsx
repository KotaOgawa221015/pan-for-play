'use client';

import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function QRPrintPage() {
  const [siteUrl, setSiteUrl] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setSiteUrl(window.location.origin);
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mb-8 flex justify-between items-center print:hidden border-b pb-4">
        <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
          &larr; 管理画面トップに戻る
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 shadow-sm transition"
        >
          PDFとして保存 / 印刷
        </button>
      </div>

      <div className="flex flex-col items-center justify-center mt-20 gap-y-8">
        <h1 className="text-4xl font-semibold text-zinc-900 tracking-wider">
          Pancolle
        </h1>
        <p className="text-xl text-zinc-600">在庫ステータスボード</p>

        <p className="text-zinc-500">
          以下のQRコードをスキャンしてアクセスしてください
        </p>

        <div className="p-8 border-4 border-zinc-200 rounded-[2rem]">
          {isMounted && siteUrl ? (
            <QRCodeSVG value={siteUrl} size={256} level="H" />
          ) : (
            <div className="size-[256px] bg-zinc-100 animate-pulse" />
          )}
        </div>

        <p className="text-zinc-400 font-mono text-sm">{siteUrl}</p>
      </div>
    </div>
  );
}
