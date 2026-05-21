'use client';

import Image from 'next/image';
import { useState } from 'react';

type Props = {
  isReading: boolean;
  message: string | null;
  isError: boolean;
  hasDraft: boolean;
  draftFileName?: string;
  onRead: (formData: FormData) => Promise<void>;
  onOpenDraft: () => void;
  onDeleteDraft: () => void;
};

export function UploadPanel({
  isReading,
  message,
  isError,
  hasDraft,
  draftFileName,
  onRead,
  onOpenDraft,
  onDeleteDraft,
}: Props) {
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

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName('');
      return;
    }

    setFileName(file.name.trim());

    const formData = new FormData();
    formData.append('file', file);
    await onRead(formData);

    event.target.value = '';
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

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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

        <label className="group block border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 text-center cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
          <input
            id="file"
            name="file"
            type="file"
            accept="image/png"
            required={!hasDraft}
            disabled={isReading}
            onChange={handleFileChange}
            className="sr-only"
          />
          <div className="space-y-3">
            <div className="text-2xl">📄</div>
            {fileName ? (
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                選択中:{' '}
                <span className="underline font-semibold">{fileName}</span>
              </p>
            ) : hasDraft ? (
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                保持中:{' '}
                <span className="underline font-semibold">{draftFileName}</span>
              </p>
            ) : (
              <p className="inline-block text-sm font-medium text-zinc-600 dark:text-zinc-300 group-hover:underline group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                撮影した納品書の画像を選択
              </p>
            )}
            {(fileName || hasDraft) && (
              <p className="text-[11px] text-zinc-400">
                ※クリックすると別のファイルを選び直せます
              </p>
            )}
          </div>
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

        {isReading ? (
          <div className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-xl font-bold text-center animate-pulse">
            読み取り中...
          </div>
        ) : hasDraft && !fileName ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onDeleteDraft}
              className="w-1/2 py-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-900/50"
            >
              画像を削除
            </button>
            <button
              type="button"
              onClick={onOpenDraft}
              className="w-1/2 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20"
            >
              読み取り結果を開く
            </button>
          </div>
        ) : null}
      </form>
    </section>
  );
}
