'use client';

import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function QRPrintPage() {
  const [siteUrl, setSiteUrl] = useState('');

  useEffect(() => {
    // クライアント側で実行時に現在のURL（オリジン）を取得してQRコードのリンク先にします
    // 例: https://pancolle.vercel.app や http://localhost:3000
    setSiteUrl(window.location.origin);
  }, []);

  return (
    <div className="min-h-screen bg-white p-8">
      {/* 操作パネル（ print:hidden により印刷・PDF化の際は非表示になります） */}
      <div className="mb-8 flex justify-between items-center print:hidden border-b pb-4">
        <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
          &larr; 管理画面トップに戻る
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 shadow-sm transition"
        >
          PDFとして保存 / 印刷
        </button>
      </div>

      {/* 印刷されるメインコンテンツ */}
      <div className="flex flex-col items-center justify-center mt-20 space-y-8">
        <h1 className="text-4xl font-bold text-zinc-900 tracking-wider">Pancolle</h1>
        <p className="text-xl text-zinc-600">在庫ステータスボード</p>

        <p className="text-zinc-500">以下のQRコードをスキャンしてアクセスしてください</p>

        {/* QRコード本体 */}
        <div className="p-8 border-4 border-zinc-200 rounded-[2rem]">
          {siteUrl ? (
            <QRCodeSVG value={siteUrl} size={256} level="H" />
          ) : (
            <div className="w-[256px] h-[256px] bg-zinc-100 animate-pulse" />
          )}
        </div>

        <p className="text-zinc-400 font-mono text-sm">{siteUrl}</p>
      </div>
    </div>
  );
}