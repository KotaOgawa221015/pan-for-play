# Vercelデプロイおよびトラブルシューティング統合レポート

本レポートは、冷凍 bread およびスープの在庫管理アプリケーション「Pan for PLAY」を本番環境（Vercel）へデプロイするにあたり、発生した一連の構成エラー、ビルドエラー、データベース接続エラーの事象、原因、およびそれらを克服した解決の軌跡を詳細にまとめたものです。

## 1. プロジェクト概要とデプロイの目的

本プロジェクトは、Next.js (v16.2.5) をベースとし、PrismaをORMに採用、本番環境の真実源（Source of Truth）としてTurso (LibSQL) データベースを組み合わせた在庫管理システムです。デプロイの目的は、ローカル環境（SQLite）での動作実績をベースに、VercelのクラウドプラットフォームとTursoの分散型データベースを用いて、安全かつスケーラブルな本番運用環境を構築することにあります。

## 2. Vercel本番環境の基本構成

アプリケーションが正常に起動・ビルドされるために確立された、Vercel側の基本設定および環境変数の構成は以下の通りです。

### 2.1 ビルド・出力設定 (Build and Output Settings)

新しいソースコードがデプロイされるたびに、データベースのスキーマが自動で本番環境に適用され、Next.jsの最適化ビルドが走るよう、以下のコマンドを一本化しました。

* Build Command: pnpm run vercel-build  
* Output Directory: デフォルト (.next)  
* Install Command: デフォルト (pnpm install) ※package.json の postinstall により prisma generate が自動実行されます。

### 2.2 稼働に必要な本番環境変数 (Environment Variables)

認証、データベース、セキュリティの各コンポーネントが安全に協調動作するために、Vercelのダッシュボードに以下の環境変数をマッピングしました。

| 環境変数名 (Key) | 役割・機能 | 本番運用の注意点   |
| :---- | :---- | :---- |
| DATABASE_URL | 本番用 Turso データベースへの接続文字列 | 末尾に余計なパスやスラッシュを入れないクリーンな状態にする。 |
| TURSO_AUTH_TOKEN | Turso データベースの認証用 JWT トークン | データベースを再作成（Recreate）した際は必ず新しいトークンへ差し替える。 |
| AUTH_SECRET | Auth.js (NextAuth) がセッション暗号化に使うキー | 本番環境では、容易に推測できないランダムな文字列（32バイト以上）が必須。 |
| AUTH_TRUST_HOST | ホスト名の安全性を明示的に信頼するフラグ | Vercel等のプロキシの背後で Auth.js v5 を動かす本番環境では true の指定が必須。 |
| AUTH_GOOGLE_ID | Google OAuth 2.0 クライアント ID | Google Cloud Console にて本番のVercelドメインのリダイレクトURIを要許可。 |
| AUTH_GOOGLE_SECRET | Google OAuth 2.0 クライアント シークレット | 認証コードとアクセストークンの交換のために秘匿。 |

## 3. 発生した問題と解決の軌跡 (Troubleshooting History)

開発環境から本番環境への移行フェーズにおいて、環境のギャップに起因する複数のエラーに直面しました。以下にその因果関係と対策を時系列で整理します。

### 3.1 認証設定エラー（500 Configuration Error）の解決

初期デプロイ直後、ログイン画面へのアクセス時等に There is a problem with the server configuration. (Configuration:1 500 Error) が発生しました。これは以下の複合的な原因によるものでした。

* 原因①: ミドルウェアの空設定  
  ルート保護を行う src/proxy.ts 内で providers: [] とプロバイダ配列が空になっていたため、ミドルウェア側で本番用の認証コンポーネントが初期化できずコケていました。  
* 原因②: セキュリティ情報の不整合と不足  
  本番環境用の AUTH_TRUST_HOST=true がVercelに設定されておらず、また AUTH_SECRET の強度が本番用チェックを通過していませんでした。  
* 対策: src/proxy.ts に Google プロバイダを明示的に注入し、Macのターミナルで openssl rand -base64 32 を用いて極めて強固な AUTH_SECRET を再生成してVercelに設定。さらに AUTH_TRUST_HOST=true を追加して信頼関係を明示しました。

### 3.2 物理環境のギャップ（ENOENT: no such file or directory, open '.env'）の解決

環境変数の追加後にビルドを行ったところ、Vercelのビルドステージで scripts/turso-migrate.ts が ENOENT: .env を吐いて異常終了しました。

* 原因: あなたのMac（ローカル環境）では物理ファイルとして .env が存在しますが、Vercel上では環境変数がサーバープロセスに直接注入されるため、物理ファイルとしての .env は存在しません。それにもかかわらず、スクリプト側で loadEnvFile?.() がファイルの存在チェックを挟まずに直接実行されていたため、ファイル未検出エラーになっていました。  
* 対策: scripts/turso-migrate.ts, scripts/turbo-health.ts, scripts/turso-recreate.ts の各スクリプト冒頭に import { existsSync } from 'node:fs'; を追加し、if (existsSync('.env')) { loadEnvFile?.(); } のように、「物理ファイルが存在するときのみ読み込む」ガード条件を実装しました。これにより、物理ファイルのないVercel上でも安全にスキップされるようになりました。

### 3.3 データベースルーティングエラー（HTTP status 404）の解決

物理ファイルのギャップを修正した後に発生したのが、マイグレーションスクリプト実行時における SERVER_ERROR: Server returned HTTP status 404 です。

* 原因: Vercelの管理画面に登録されていた DATABASE_URL の末尾に、余計なパス（例: /pan-for-play-db）や末尾のスラッシュ（/）が含まれていたため、Tursoの分散ルーター側が「該当するデータベースのアドレスが存在しない」と判断し、HTTP 404 (Not Found) を返していました。  
* 対策: ターミナルで turso db show pan-for-play-db を実行して本番用の正確なURL（libsql://...）を再確認し、末尾が .turso.io で綺麗に終わる正規の接続文字列へとVercelの設定を修正しました。

## 4. ワークフローの有効化と今後の保守手順

一連のエラーをすべて解消したことで、本プロジェクトの「継続的デプロイ（CD）ワークフロー」が完全に有効化されました。今後の開発および運用保守は、以下のクリーンなライフサイクルに沿って安全に自動実行されます。

1. コードのプッシュ（Gitとの連動）  
   ローカルで実装した新機能やバグ修正を main ブランチへ git push origin main すると、Vercelがそれを即座に検知してビルドパイプラインを起動します。  
2. 安全なスキーマの自動同期（DB自動マイグレーション）  
   ビルドプロセスの中で、修正された turso-migrate.ts が .env の有無に関わらず安全に起動し、本番環境の Turso データベースに対して未適用のマイグレーションSQLファイル（prisma/migrations/ 内の資産）を順序通りに自動適用します。  
3. Next.js 最適化と配置  
   スキーマが最新化された直後に next build が走り、アプリケーション全体の静的最適化、型チェック、ルーティングのコンパイルが正常に行われ、世界中のエッジサーバーへ新しいバージョンがデプロイされます。

運用上のアドバイス: 今後、手元の開発環境で scripts/turso-recreate.ts --force を実行してTursoデータベースを初期化・再生成した場合は、画面に新しく出力される TURSO_AUTH_TOKEN をコピーし、Vercelの環境変数を更新した上で、ビルドキャッシュをオフにした「Redeploy」を実行するだけで、いつでも本番環境を最新の状態に維持することができます。

本システムは現在、認証ガード・データベースマイグレーションともにVercelのクラウドネイティブなベストプラクティスに準拠した堅牢な状態で本番稼働しています。
