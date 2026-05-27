# Vercel Cron メンテナンス設定

この文書は、保持期限ベースのデータメンテナンスを Vercel Cron で実行する現行構成を記述する。

## 構成

定期実行のスケジュールは `vercel.json` の `crons` で管理される。

実行本体は `src/app/api/cron/maintenance/route.ts` の `GET` ハンドラである。

保持期限ロジックは `src/features/retention/cleanup.ts` が所有する。

## 実行経路

Vercel Cron は指定時刻に `GET /api/cron/maintenance` を呼び出す。

`route.ts` は `Authorization: Bearer <CRON_SECRET>` を検証し、認証成功時のみメンテナンス処理を実行する。

メンテナンス処理は以下を対象とする。

- 30日を超えた `InventoryStatusChange` の削除
- 30日を超えた `deletedAt` を持つ `Fridge` の物理削除
- 30日を超えた `deletedAt` を持つ `User` の物理削除

## 設定値

`CRON_SECRET` は Vercel Project の Environment Variables に設定される。

## スケジュール

`vercel.json` の現行スケジュールは `0 3 * * *` である。

この値は UTC 基準で毎日 03:00 の実行を表す。

## 運用方針

データクリーンアップの実行経路は Cron に統一される。

管理画面の手動クリーンアップ UI とサーバーアクションは運用導線から除外される。

手動実行が必要な場合は、`Authorization: Bearer <CRON_SECRET>` を付与して `GET /api/cron/maintenance` を呼び出す。

`CRON_SECRET` は `.env.example` には含めない。

保持日数と1回あたりの削除上限は実装内の定数で管理され、実行時には変更しない。
