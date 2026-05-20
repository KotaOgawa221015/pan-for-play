import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | パンコレ',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 text-zinc-800 dark:text-zinc-200">
      <div className="max-w-2xl mx-auto space-y-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold border-b border-zinc-200 dark:border-zinc-800 pb-4">
          プライバシーポリシー
        </h1>
        <p className="text-sm text-zinc-500">最終更新日: 2026年5月20日</p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. 収集する個人情報</h2>
          <p className="text-sm leading-relaxed">
            本サービスでは、ユーザーがサインアップまたはログインする際に、以下の情報を収集します。
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>
              Googleアカウントから提供されるプロフィール情報（氏名、メールアドレス、プロフィール画像）
            </li>
            <li>
              本サービス内での操作ログ（在庫ステータスの変更履歴、納品書のアップロード履歴等）
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. 情報の利用目的</h2>
          <p className="text-sm leading-relaxed">
            収集した情報は、以下の目的でのみ利用します。
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>ユーザー認証および不正アクセスの防止</li>
            <li>
              在庫管理ボードにおける「最終変更者」の表示およびトレーサビリティ（監査ログ）の確保
            </li>
            <li>管理者によるユーザー権限管理（管理者への昇格等）</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3. 情報の第三者提供</h2>
          <p className="text-sm leading-relaxed">
            本サービスは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            4. データの保持と削除（退会）
          </h2>
          <p className="text-sm leading-relaxed">
            ユーザーがマイページから退会手続き（アカウント削除）を完了した場合、紐づいていたOAuth認証トークンおよびアカウント情報は速やかにデータベースから削除されます。なお、過去の在庫変更ログに記録された氏名などのテキスト情報は、退会後に自動で匿名化または論理削除処理が行われます。
          </p>
        </section>

        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <Link
            href="/login"
            className="text-sm text-emerald-600 font-semibold hover:underline"
          >
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
