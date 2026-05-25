'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type Props = {
  fridges: { id: string; name: string; isDefault: boolean }[];
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
  fridges,
  isReading,
  hasDraft,
  draftFileName,
  onOpenDraft,
  onDeleteDraft,
  message,
  isError,
  onRead,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<{
    src: string;
    alt: string;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [selectedFile]);

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
    if (!selectedFile) return;
    await onRead(new FormData(event.currentTarget));
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

        <label className="block border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 text-center cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
          {previewUrl ? (
            <div className="space-y-3">
              <div className="relative mx-auto h-52 max-w-3xl overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                <Image
                  src={previewUrl}
                  alt="選択した納品書画像のプレビュー"
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 768px, 100vw"
                  className="object-contain"
                />
              </div>
              <span className="block text-xs text-zinc-500">{fileName}</span>
              <span className="inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                別の画像を選択
              </span>
            </div>
          ) : (
            <>
              <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                撮影した納品書の画像を選択してください
              </span>
              <span className="block text-xs text-zinc-400 dark:text-zinc-500 mb-4">
                対応形式: PNGのみ | 最大サイズ: 5MBまで
              </span>
              <span className="inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                ファイルを選択
              </span>
            </>
          )}
          <input
            id="file"
            name="file"
            type="file"
            accept="image/png"
            required
            disabled={isReading}
            ref={fileInputRef}
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setSelectedFile(nextFile);
              setFileName(nextFile?.name.trim() ?? '');
            }}
            className="sr-only"
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

        <div className="space-y-2">
          <label
            htmlFor="fridgeId"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            対象の冷蔵庫
          </label>
          <select
            id="fridgeId"
            name="fridgeId"
            required
            defaultValue={fridges.find((f) => f.isDefault)?.id || ''}
            disabled={isReading}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm"
          >
            <option value="" disabled>
              冷蔵庫を選択してください
            </option>
            {fridges.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {selectedFile ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={clearSelectedFile}
              disabled={isReading}
              className="w-full rounded-xl border border-rose-300 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
            >
              削除
            </button>
            <button
              type="submit"
              disabled={isReading}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:bg-zinc-400 transition shadow-lg shadow-emerald-500/20"
            >
              {isReading ? '読み取り中...' : '内容を読み取る'}
            </button>
          </div>
        ) : null}

        <div className="space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            撮影のポイント
          </h3>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center justify-center gap-1.5 px-2 py-1 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="text-xs leading-none">⭕</span>
                読み取り可能な例 (OK)
              </div>
              <div className="grid gap-2 grid-cols-1">
                {goodExamples.map((example, idx) => (
                  <div key={example.src || idx} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setExpandedImage(example)}
                      className="block w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950"
                    >
                      <Image
                        src={example.src}
                        alt={example.alt}
                        width={example.width}
                        height={example.height}
                        loading="eager"
                        className="h-24 w-full bg-white object-contain"
                        unoptimized
                      />
                    </button>
                    <p className="text-[11px] text-zinc-500 text-center">
                      {example.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-900/40 dark:bg-rose-950/20 md:col-span-3">
              <div className="flex items-center justify-center gap-1.5 px-2 py-1 text-center text-xs font-semibold text-rose-600 dark:text-rose-400">
                <span className="text-xs leading-none">❌</span>
                エラーになりやすい例 (NG)
              </div>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {badExamples.map((example, idx) => (
                  <div key={example.alt || idx} className="space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedImage({
                          src: example.src,
                          alt: example.alt,
                          width: 914,
                          height: 446,
                        })
                      }
                      className="block w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950"
                    >
                      <Image
                        src={example.src}
                        alt={example.alt}
                        width={914}
                        height={446}
                        className="h-24 w-full bg-white object-contain"
                        unoptimized
                      />
                    </button>
                    <p className="text-[11px] text-zinc-500 text-center">
                      {example.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>

      {expandedImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="拡大画像"
          tabIndex={-1}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setExpandedImage(null);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setExpandedImage(null);
            }
          }}
        >
          <div className="relative w-full max-w-5xl">
            <button
              type="button"
              onClick={() => setExpandedImage(null)}
              className="absolute right-2 top-2 z-10 rounded-md bg-black/60 px-3 py-1 text-sm font-semibold text-white hover:bg-black/75"
            >
              閉じる
            </button>
            <Image
              src={expandedImage.src}
              alt={expandedImage.alt}
              width={expandedImage.width}
              height={expandedImage.height}
              className="max-h-[85vh] w-full bg-white object-contain"
              unoptimized
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
