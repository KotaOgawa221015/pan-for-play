'use client';

import { useState } from 'react';
import { Minus, Plus, ArrowRight, Soup } from 'lucide-react';

// パンのデータ構造（本来はAPIやDBから取得）
const INITIAL_BREADS = [
  { id: 1, name: 'クロワッサン', count: 0 },
  { id: 2, name: '食パン（6枚切）', count: 0 },
  { id: 3, name: 'カレーパン', count: 0 },
];

export default function BreadInputPage() {
  const [breads, setBreads] = useState(INITIAL_BREADS);

  // 個数の増減処理
  const updateCount = (id: number, delta: number) => {
    setBreads(
      breads.map((item) =>
        item.id === id
          ? { ...item, count: Math.max(0, item.count + delta) }
          : item,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 pb-24">
      {/* ヘッダー */}
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800">パンの選択</h1>
        <p className="text-sm text-gray-500">購入する個数を選んでください</p>
      </header>

      {/* パンのリスト */}
      <div className="space-y-4 flex-grow">
        {breads.map((bread) => (
          <div
            key={bread.id}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"
          >
            <span className="font-medium text-gray-700 text-lg">
              {bread.name}
            </span>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => updateCount(bread.id, -1)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
              >
                <Minus size={20} />
              </button>

              <span className="text-xl font-bold w-6 text-center">
                {bread.count}
              </span>

              <button
                type="button"
                onClick={() => updateCount(bread.id, 1)}
                className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center active:bg-blue-600 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 下部ナビゲーション・アクション */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex flex-col gap-3">
        <div className="flex gap-2">
          {/* スープ画面への切り替えボタン */}
          <button
            type="button"
            className="flex-1 py-3 px-4 bg-orange-50 text-orange-600 rounded-lg font-semibold flex items-center justify-center gap-2 border border-orange-100"
          >
            <Soup size={20} />
            スープへ
          </button>
        </div>

        {/* 入力完了ボタン */}
        <button
          type="button"
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
        >
          入力完了して確認へ
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
