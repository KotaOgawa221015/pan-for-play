# データベースのマイグレーションと再構築手順

本プロジェクト（Pan for PLAY）では、ローカル開発環境用のSQLiteと、本番・検証環境用のTurso（リモートデータベース）の両方をサポートしています。環境や目的に合わせて以下のコマンドを使用してください。

## ローカル環境（SQLite）の手順

ローカル環境のデータベース操作は、主に pnpm または just コマンドを使用します。

### マイグレーションの適用

スキーマ変更など、未適用のマイグレーションファイルをローカルのデータベースに反映します。

```bash
pnpm run db:migrate
# または
just local-migrate
```

### データベースのリセット（再構築）

現在のローカルデータベースを一度破棄して再作成し、初期データ（シード）を投入します。開発中にデータを初期状態に戻したい場合に便利です。

```bash
pnpm run db:reset
# または
just local-reset
```

## リモート環境（Turso）の手順

Turso環境に対する操作には専用のスクリプトを使用します。事前にプロジェクト直下の .env ファイルに DATABASE_URL、TURSO_DATABASE_NAME、TURSO_AUTH_TOKEN_EXPIRATION の設定が必要です。

### マイグレーションの適用

Turso上のデータベースに、既存のSQLマイグレーションファイルを適用します。

```bash
pnpm exec tsx scripts/turso-migrate.ts
# または
just turso-migrate
```

### データベースの再構築（破壊的変更）

Turso上のデータベースを完全に削除し、新規作成からシードデータの投入までを一括で行います。既存のデータはすべて失われるため注意してください。

```bash
pnpm exec tsx scripts/turso-recreate.ts --force
# または
just turso-reset
```

> ⚠️ 実行後の注意
> 再構築コマンドの実行が完了すると、コンソールに新しいデータベースの認証トークンが出力されます。Vercelなどのデプロイメント環境に設定しているランタイムシークレット（TURSO_AUTH_TOKEN）を、必ずこの新しい値に更新してください。
