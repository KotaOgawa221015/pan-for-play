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
    auth/
    inventory/
    product-catalog/
    product-list-extraction/
    profile/
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

トップページ在庫の商品集合と数量は最新の `InventoryPublication` が参照する `UploadBatch` から導出する。

表示対象は最新公開された納品書の `lines` である。`count = 0` の行はトップページに表示しない。

初期在庫ステータスは `features/inventory/counts.ts` の数量閾値で導出する。トップページでの個別状態変更が存在する場合は、各商品の最新 `InventoryStatusChange` が表示ステータスを上書きする。

手動の個別ステータス更新は現行モデルに含まれる。トップページのカード操作は `InventoryStatusChange` を1件追加する。

受け入れ適用と再公開は、新しい `InventoryPublication` を追加して現在在庫の参照先を置き換える。

商品別の変更者追跡は `InventoryStatusChange` が所有する。数量は根拠データであり、変更者ログはユーザ可視の在庫ステータスが変化した商品だけを記録する。

## 受け入れフローの境界

`features/product-list-extraction` は OCR/VLM 抽出インターフェースとモック抽出データを所有する。

`features/receiving` はレビュー下書き作成、レビュー適用、履歴ステータス遷移を所有する。

`features/product-catalog` は商品カタログの検索と新規登録を所有する。

受け入れ適用は次の不変条件で動作する。

1. 対象バッチは `PROCESSED` のまま保持する。
2. 対象バッチを参照する新しい `InventoryPublication` を作成する。
3. 直前公開との差分から `InventoryStatusChange` を作成する。
4. トップページ在庫は最新 `InventoryPublication` のバッチ行から導出される。

## Fixture の責務

`prisma/fixtures` は DB シード用 fixture のみを置く。

OCR/VLM のモック抽出 fixture は `src/features/product-list-extraction` に置く。
