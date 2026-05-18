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
  const examples = [
    {
      src: '/receiving-examples/sample1.png',
      alt: '読み取りに適した納品書画像の例 1',
      width: 676,
      height: 334,
    },
    {
      src: '/receiving-examples/sample2.png',
      alt: '読み取りに適した納品書画像の例 2',
      width: 914,
      height: 446,
    },
    {
      src: '/receiving-examples/sample6.png',
      alt: '読み取りに適した納品書画像の例 3',
      width: 2657,
      height: 1293,
    },
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fileName) {
      return;
    }

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
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            納品書全体が写り、文字と数量がまっすぐ見える画像を使ってください。
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {examples.map((example) => (
              <figure
                key={example.src}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950"
              >
                <Image
                  src={example.src}
                  alt={example.alt}
                  width={example.width}
                  height={example.height}
                  className="h-28 w-full bg-white object-contain"
                />
              </figure>
            ))}
          </div>
        </div>

        <label className="block border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-center">
          <span className="block text-sm text-zinc-500 mb-3">
            撮影した納品書の画像を選択してください
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
              disabled:opacity-50 cursor-pointer"
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
