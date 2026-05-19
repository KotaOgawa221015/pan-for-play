# pnpm-workspace.yaml 設定メモ

Pancolle では、pnpm のプロジェクト設定を `pnpm-workspace.yaml` に集約する。

目的は、依存関係の再現性を保ちつつ、公開直後のパッケージ、推移依存の特殊な参照、未レビューの build script を避けること。

## 設定

```yaml
# WARNING: NEVER run "corepack enable" on the local developer machine!
# Doing so pollutes the host PATH shims (e.g. fnm/nvm) and breaks local Homebrew/system pnpm.
# Corepack must only be enabled inside isolated environments (Docker/CI).

allowBuilds:
  '@prisma/engines': true
  better-sqlite3: true
  prisma: true
  sharp: true
  esbuild: true
  tesseract.js: true

minimumReleaseAge: 4320
minimumReleaseAgeStrict: true
blockExoticSubdeps: true

strictDepBuilds: true
dangerouslyAllowAllBuilds: false
verifyDepsBeforeRun: false

engineStrict: true
```

## 各設定の意味

### `minimumReleaseAge: 4320`

公開から 3 日未満のパッケージを依存解決の対象にしない。

公開直後の悪意あるパッケージや、侵害されたパッケージを即座に取り込むリスクを下げる。

### `minimumReleaseAgeStrict: true`

`minimumReleaseAge` を厳格に適用する。

条件を満たすバージョンがない場合、別の新しいバージョンへフォールバックせず失敗させる。

### `blockExoticSubdeps: true`

推移依存から git、URL tarball、local file などの特殊な依存が入ることを防ぐ。

依存の取得元を npm registry 中心に保つ。

### `strictDepBuilds: true`

依存パッケージの build script を許可リスト方式にする。

必要なものだけ `allowBuilds` で明示的に許可する。

### `dangerouslyAllowAllBuilds: false`

すべての build script を無条件に許可しない。

### `verifyDepsBeforeRun: false`

`pnpm run` / `pnpm exec` 実行前の依存同期状態のチェックおよび対話プロンプト表示を無効化する。

プロンプトがコマンド実行を妨げ、UX を悪化させるのを防ぐ。

### `engineStrict: true`

`package.json` の `engines` に合わない Node.js では install を失敗させる。

## build script を許可しているパッケージ

### `@prisma/engines` / `prisma`

Prisma Client の生成や DB 操作に必要なため許可する。

### `better-sqlite3`

native module を含むため、環境によって build script が必要になる。

### `sharp`

画像処理用の native module で、binary の準備が必要になる場合がある。

### `esbuild`

開発ビルドや VitePress でのトランスパイル用にバイナリが必要なため許可する。

### `tesseract.js`

OCR機能に必要なビルドスクリプトを実行するため許可する。

## 運用ルール

### ローカルでの Corepack 有効化の禁止

ローカルの開発マシンでは、絶対に `corepack enable` を実行してはならない。

実行すると fnm や nvm などの PATH shim が書き換わり、Homebrew などのシステムにインストールされたローカル常用 pnpm が正常に動作しなくなる。

Corepack は Docker や CI のような、コンテナ化・孤立化された再現環境でのみ有効化する。

### CI環境でのインストールとロックファイル管理

CI では以下を実行する。

```sh
pnpm install --frozen-lockfile
```

lockfile の更新はローカルで行い、`pnpm-lock.yaml` を commit する。
