'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { NavigationButton } from '@/components/NavigationButton';

// カテゴリの定義（集計用）
const CATEGORIES = {
  bread: ['クロワッサン', 'カレーパン', '食パン', 'メロンパン'],
  soup: ['コーンポタージュ', 'ミネストローネ', 'クラムチャウダー', 'オニオンスープ']
};

function ConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // URLから全アイテムを取得
  const allSelected = Array.from(searchParams.entries());

  // カテゴリごとに合計個数を算出
  const totalBread = allSelected
    .filter(([name]) => CATEGORIES.bread.includes(name))
    .reduce((sum, [_, count]) => sum + parseInt(count, 10), 0);

  const totalSoup = allSelected
    .filter(([name]) => CATEGORIES.soup.includes(name))
    .reduce((sum, [_, count]) => sum + parseInt(count, 10), 0);

  const handlePayment = () => {
    // 遷移先ベースURL
    const baseUrl = "https://panforyou.oneqr.io/shops/shp_ecdfd1f6202ea0bd893fb46";
    
    const params = new URLSearchParams();
    
    // 遷移先の仕様に合わせ、「パン合計」と「スープ合計」をパラメータにセット
    // ※遷移先のサイトが期待するキー名（例: bread_qty 等）が分かれば適宜変更してください
    if (totalBread > 0) params.append('bread', totalBread.toString());
    if (totalSoup > 0) params.append('soup', totalSoup.toString());

    window.location.href = `${baseUrl}?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black p-6 flex flex-col">
      <header className="mb-8 text-center">
        <h1 className="text-xl font-bold">注文内容の最終確認</h1>
        <p className="text-sm text-zinc-400 mt-2">決済サイトへは合計数で送信されます</p>
      </header>
      
      <main className="flex-1 space-y-8 max-w-md mx-auto w-full">
        {/* ユーザー向けの詳しい内訳表示 */}
        <section className="bg-zinc-50 p-6 rounded-3xl dark:bg-zinc-900">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">注文の内訳</h2>
          <div className="space-y-3">
            {allSelected.map(([name, count]) => (
              <div key={name} className="flex justify-between items-center">
                <span className="text-zinc-700 dark:text-zinc-300">{name}</span>
                <span className="font-bold">{count} 個</span>
              </div>
            ))}
          </div>
        </section>

        {/* 遷移先に送られる合計値の表示 */}
        <section className="px-6 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-2">
          <div className="flex justify-between text-lg font-bold">
            <span>パン 合計</span>
            <span>{totalBread} 個</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>スープ 合計</span>
            <span>{totalSoup} 個</span>
          </div>
        </section>
      </main>

      <footer className="mt-12 space-y-4 flex flex-col items-center">
        <NavigationButton onClick={handlePayment} className="w-full max-w-xs">
          はい（決済画面へ）
        </NavigationButton>
        <NavigationButton onClick={() => router.back()} variant="secondary" className="w-full max-w-xs">
          戻る
        </NavigationButton>
      </footer>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<p className="text-center p-10">読み込み中...</p>}>
      <ConfirmContent />
    </Suspense>
  );
}