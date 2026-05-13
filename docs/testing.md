# テスト構造

この文書は、現行実装が従うテスト配置と責務境界を定義する。

## 配置

ユニットテストは、振る舞いを所有する実装の近くに置く。現在の例は `src/types/inventory.test.ts` である。

リポジトリ直下の `tests/` は、複数モジュールやフレームワーク境界をまたぐテストを置く。現在の例は `tests/integration/inventory-actions.test.ts` である。

```txt
src/
  types/
    inventory.ts
    inventory.test.ts

tests/
  integration/
    inventory-actions.test.ts
```

## 境界

近接配置するテストは、単一モジュールが所有する公開契約を検証する。`inventory.ts` では、受け入れる在庫状態と、その状態ごとの表示メタデータが契約である。

`tests/integration` のテストは、feature、Next.js ランタイム API、永続化境界の組み合わせとして観測される振る舞いを検証する。`inventory-actions.test.ts` では、商品一覧の整形、無効な状態値の拒否、更新後の再検証要求がその対象である。

## 運用原則

テストは実装詳細ではなく owning boundary の外部可観測な振る舞いを固定する。

外部依存をまたぐ統合は、境界を越える必要があるときだけ `tests/` に上げる。単一モジュールで閉じる契約は近接配置から外さない。

共通の fixture や補助関数は、重複が現実の負債になった時点で追加する。用途が一つしかない段階では、テストの近くに置く。
