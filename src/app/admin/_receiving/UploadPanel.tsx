'use client';

import Image from 'next/image';
import { useState } from 'react';

type Props = {
  isReading: boolean;
  message: string | null;
  isError: boolean;
  onRead: (formData: FormData) => Promise<void>;
};

export function UploadPanel({ isReading, message, isError, onRead }: Props) {
  const [fileName, setFileName] = useState('');

  const goodExamples = [
    {
      src: '/receiving-examples/sample1.png',
      alt: '良い例 1',
      width: 676,
      height: 334,
      desc: '全体がまっすぐ写っている',
    },
    {
      src: '/receiving-examples/sample2.png',
      alt: '良い例 2',
      width: 914,
      height: 446,
      desc: '文字と数量が鮮明',
    },
  ];

  const badExamples = [
    {
      src: '',
      alt: '悪い例（ブレ・傾き）',
      desc: '文字がブレている・斜めに傾いている',
    },
    {
      src: '',
      alt: '悪い例（見切れ）',
      desc: '商品名や数量の端が見切れている',
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
        <div className="space-y-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            撮影のポイント
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs">
                  ⭕
                </span>
                読み取り可能な例 (OK)
              </div>
              <div className="grid gap-2 grid-cols-2">
                {goodExamples.map((example, idx) => (
                  <div key={example.src || idx} className="space-y-1">
                    <figure className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950">
                      <Image
                        src={example.src}
                        alt={example.alt}
                        width={example.width}
                        height={example.height}
                        className="h-24 w-full bg-white object-contain"
                        unoptimized
                      />
                    </figure>
                    <p className="text-[10px] text-zinc-500 text-center">
                      {example.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs">
                  ❌
                </span>
                エラーになりやすい例 (NG)
              </div>
              <div className="grid gap-2 grid-cols-2">
                {badExamples.map((example, idx) => (
                  <div key={example.alt || idx} className="space-y-1">
                    <figure className="overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950 h-24 flex items-center justify-center p-2 text-center">
                      {example.src ? (
                        <Image
                          src={example.src}
                          alt={example.alt}
                          width={200}
                          height={100}
                          className="h-full w-full bg-white object-contain"
                          unoptimized
                        />
                      ) : (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                          {example.alt}
                        </span>
                      )}
                    </figure>
                    <p className="text-[10px] text-zinc-500 text-center">
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
