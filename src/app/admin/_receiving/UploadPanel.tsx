'use client';

import Image from 'next/image';
import { useState } from 'react';

type Props = {
  isReading: boolean;
  hasDraft: boolean;
  draftFileName?: string;
  onOpenDraft: () => void;
  onDeleteDraft: () => void;
  message: string | null;
  isError: boolean;
  onRead: (formData: FormData) => Promise<void>;
};

export function UploadPanel({
  isReading,
  hasDraft,
  draftFileName,
  onOpenDraft,
  onDeleteDraft,
  message,
  isError,
  onRead,
}: Props) {
  const [fileName, setFileName] = useState('');

  const goodExamples = [
    {
      src: '/receiving-examples/delivery_slip_correct.png',
      alt: '正しい例',
      width: 914,
      height: 446,
      desc: '全体がまっすぐ写っている',
    },
  ];

  const badExamples = [
    {
      src: '/receiving-examples/delivery_slip_blurred.png',
      alt: '誤り例（ブレ）',
      desc: '文字がブレていて判読しづらい',
    },
    {
      src: '/receiving-examples/delivery_slip_tilted.png',
      alt: '誤り例（傾き）',
      desc: '用紙が傾いている',
    },
    {
      src: '/receiving-examples/delivery_slip_excessive .png',
      alt: '誤り例（近すぎ）',
      desc: '商品名や個数、合計、空白の行が含まれている',
    },
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fileName) return;
    await onRead(new FormData(event.currentTarget));
  }

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
      <div className="mb-6 space-y-2">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          画像アップロード
        </h2>
        <p className="text-xs text-zinc-500">
          PNG
          の納品書画像を選択すると、読取結果をレビュー用モーダルで確認できます。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {hasDraft ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p>未反映の下書きがあります: {draftFileName ?? '納品書'}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={onOpenDraft}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
              >
                下書きを再開
              </button>
              <button
                type="button"
                onClick={onDeleteDraft}
                className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
              >
                下書きを破棄
              </button>
            </div>
          </div>
        ) : null}

        <div className="space-y-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            撮影のポイント
          </h3>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="text-xs leading-none">⭕</span>
                読み取り可能な例 (OK)
              </div>
              <div className="grid gap-2 grid-cols-1">
                {goodExamples.map((example, idx) => (
                  <div key={example.src || idx} className="space-y-1">
                    <figure className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950">
                      <Image
                        src={example.src}
                        alt={example.alt}
                        width={example.width}
                        height={example.height}
                        loading="eager"
                        className="h-24 w-full bg-white object-contain"
                        unoptimized
                      />
                    </figure>
                    <p className="text-[11px] text-zinc-500 text-center">
                      {example.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 md:col-span-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <span className="text-xs leading-none">❌</span>
                エラーになりやすい例 (NG)
              </div>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {badExamples.map((example, idx) => (
                  <div key={example.alt || idx} className="space-y-1">
                    <figure className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950">
                      <Image
                        src={example.src}
                        alt={example.alt}
                        width={914}
                        height={446}
                        className="h-24 w-full bg-white object-contain"
                        unoptimized
                      />
                    </figure>
                    <p className="text-[11px] text-zinc-500 text-center">
                      {example.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <label className="block border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 text-center cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
          <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            撮影した納品書の画像を選択してください
          </span>
          <span className="block text-xs text-zinc-400 dark:text-zinc-500 mb-4">
            対応形式: PNGのみ | 最大サイズ: 5MBまで
          </span>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/png"
            required
            disabled={isReading}
            onChange={(event) =>
              setFileName(event.target.files?.[0]?.name.trim() ?? '')
            }
            className="block w-full text-sm text-zinc-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-zinc-900 file:text-white
              hover:file:bg-zinc-800
              dark:file:bg-zinc-100 dark:file:text-zinc-900
              disabled:opacity-50 cursor-pointer mx-auto max-w-xs"
          />
        </label>

        {message ? (
          <p
            className={`rounded-xl px-4 py-3 text-sm ${
              isError
                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}
          >
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isReading || !fileName}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:bg-zinc-400 transition shadow-lg shadow-emerald-500/20"
        >
          {isReading ? '読み取り中...' : 'アップロードして読み込む'}
        </button>
      </form>
    </section>
  );
}
