import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: '利用規約 | パンコレ',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 text-zinc-800 dark:text-zinc-200">
            <div className="max-w-2xl mx-auto space-y-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
                <h1 className="text-2xl font-bold border-b border-zinc-200 dark:border-zinc-800 pb-4">利用規約</h1>
                <p className="text-sm text-zinc-500">最終更新日: 2026年5月20日</p>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">第1条（適用）</h2>
                    <p className="text-sm leading-relaxed">
                        本規約は、冷凍パン・スープ在庫管理アプリケーション「Pancolle（パンコレ）」（以下、「本サービス」）の利用条件を定めるものです。本サービスの利用者（以下、「ユーザー」）は、本規約に同意の上、本サービスを利用するものとします。
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">第2条（ユーザー認証）</h2>
                    <p className="text-sm leading-relaxed">
                        ユーザーは、Googleアカウントを用いたOAuth認証、または管理者が指定した方法によって本サービスにサインアップおよびログインするものとします。認証情報の管理はユーザーが自己の責任において行うものとします。
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">第3条（在庫データの更新と記録）</h2>
                    <p className="text-sm leading-relaxed">
                        本サービスでは、ユーザーが操作した在庫ステータスの変更や、管理者が行った納品書データの反映に伴い、操作を行ったユーザーの名称および変更日時がシステム内にログとして記録され、他のユーザーに公開されます。ユーザーはこれに同意した上で操作を行うものとします。
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">第4条（禁止事項）</h2>
                    <p className="text-sm leading-relaxed">
                        ユーザーは、本サービスの利用にあたり、システムの改ざん、不正アクセス、他のユーザーの運用を妨害する行為、その他管理者が不適切と判断する行為を行ってはなりません。
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">第5条（退会・アカウントの削除）</h2>
                    <p className="text-sm leading-relaxed">
                        ユーザーは、マイページよりいつでも自らアカウントを削除（退会）することができます。退会処理が実行された場合、連携された認証情報は即座に削除され、登録データは匿名化されます。
                    </p>
                </section>

                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                    <Link href="/login" className="text-sm text-emerald-600 font-semibold hover:underline">
                        ログイン画面に戻る
                    </Link>
                </div>
            </div>
        </div>
    );
}