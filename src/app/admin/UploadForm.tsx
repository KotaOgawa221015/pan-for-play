'use client';

import { useState } from 'react';

export function UploadForm() {
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsProcessing(true);

    // OCR処理のシミュレーション
    console.log('OCR処理がここに実装されます');

    setTimeout(() => {
      alert('画像を送信しました（OCR処理は現在準備中です）');
      setIsProcessing(false);
    }, 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-center">
        <input
          id="file"
          name="file"
          type="file"
          accept="image/*"
          required
          disabled={isProcessing}
          className="block w-full text-sm text-zinc-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-zinc-900 file:text-white
            hover:file:bg-zinc-800
            dark:file:bg-zinc-100 dark:file:text-zinc-900
            disabled:opacity-50 cursor-pointer"
        />
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:bg-zinc-400 transition shadow-lg shadow-emerald-500/20"
      >
        {isProcessing ? '読み込み中...' : 'アップロードして読み込む'}
      </button>
    </form>
  );
}
