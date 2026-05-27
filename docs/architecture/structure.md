# アーキテクチャ

この文書は、現行実装の責務境界と配置基準を定義する。

## ディレクトリ構成

```txt
src/
  app/
    _components/
    layout.tsx
    page.tsx
    login/
    signup/
    profile/
    admin/

  features/
    account/
    inventory/
    product-catalog/
    receiving/

  lib/
  types/
```

`src/app` はルート境界を所有する。`page.tsx`、`layout.tsx`、ルート配下の画面構成をここに置く。

`src/features` はアプリ固有の振る舞いを所有する。検証、ドメイン判断、永続化オーケストレーション、機能間連携は feature 側で扱う。

`src/app/_components` は機能横断で再利用する表示部品を置く。業務判断は持たない。

`src/app/admin/_receiving` は管理画面専用の受け入れ UI 構成を置く。ドメインルールは `src/features` に置く。

`src/lib` はインフラ接続境界を置く。現在は Prisma クライアント初期化を配置している。

`src/types` は複数 feature から参照される共有契約を置く。

## 在庫の真実源

トップページ在庫の商品集合と数量は `CurrentInventory` から取得する。

表示対象は `CurrentInventory` の `isVisible = true` の行である。`count = 0` の行は `isVisible = false` として保持される。

納品書反映時の在庫ステータスは `features/inventory/counts.ts` の数量閾値で導出され、`CurrentInventory.status` に反映される。

手動の個別ステータス更新は `CurrentInventory` と `InventoryStatusChange` を同一トランザクションで更新する。

受け入れ適用と再公開は、新しい `InventoryPublication` を追加しながら `CurrentInventory` を更新する。

商品別の変更者追跡は `InventoryStatusChange` が所有する。数量は根拠データであり、変更者ログはユーザ可視の在庫ステータスが変化した商品だけを記録する。

## 受け入れフローの境界

`features/receiving` は納品書画像の抽出、レビュー下書き作成、レビュー入力の確定、履歴ステータス遷移を所有する。

`features/product-catalog` は商品カタログの検索、新規登録、商品名正規化を所有する。

`features/inventory` は在庫公開、在庫ステータス差分作成、手動在庫ステータス更新を所有する。

レビュー適用では、`features/receiving` が確定した商品行を作り、`features/inventory` がその結果を現在在庫として公開する。

受け入れ適用は次の不変条件で動作する。

1. 対象バッチは `PROCESSED` のまま保持する。
2. 対象バッチを参照する新しい `InventoryPublication` を作成する。
3. `CurrentInventory` を upsert し、対象外商品を `isVisible = false` に更新する。
4. 状態差分がある商品のみ `InventoryStatusChange` を作成する。
5. トップページ在庫は `CurrentInventory` から直接取得される。

## Fixture の責務

`prisma/fixtures` は DB シード用 fixture のみを置く。

OCR/VLM のテスト fixture は `tests/fixtures` に置く。
