# テスト構造

この文書は、現行実装のテスト配置と契約境界を定義する。

## 配置

ユニットテストは、振る舞いを所有する実装の近くに置く。現在の例は `src/types/inventory.test.ts` である。

リポジトリ直下の `tests/` は、複数モジュールやフレームワーク境界をまたぐテストを置く。現在の例は `tests/integration/inventory-actions.test.ts` である。

```txt
src/
  features/
    inventory/
      counts.ts
      counts.test.ts
  types/
    inventory.ts
    inventory.test.ts
```

`tests/integration` は feature 境界とランタイム境界をまたぐ振る舞いを置く。

```txt
tests/
  integration/
    inventory-actions.test.ts
    receiving/
      start-review.test.ts
      apply-review.test.ts
      history-actions.test.ts
    seed-script.test.ts
```

## 契約境界

`src/types/inventory.test.ts` は在庫ステータスの受け入れ値と表示メタデータ契約を検証する。

`src/features/inventory/counts.test.ts` は数量から在庫ステータスへの導出契約を検証する。

`tests/integration/inventory-actions.test.ts` は `CurrentInventory` からトップ在庫を取得する契約を検証する。

`tests/integration/inventory-publication-summary.test.ts` はトップページ下部に表示する公開サマリ取得契約を検証する。

`tests/integration/receiving/start-review.test.ts` はレビュー下書き作成を検証する。

`tests/integration/receiving/apply-review.test.ts` は公開イベント作成と在庫反映を検証する。

`tests/integration/receiving/history-actions.test.ts` は再公開と削除制約を検証する。

`tests/integration/seed-script.test.ts` はカタログ商品 fixture と公開履歴 fixture に基づくシード整合性を検証する。

`tests/integration/retention-cleanup.test.ts` は保持期限ベースの定期クリーンアップ契約を検証する。

## 運用原則

テストは owning boundary の外部可観測な振る舞いを固定する。

ファイル分割や近接モジュール間の責務配分のような内部構成は、境界契約でない限り固定しない。
