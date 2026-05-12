# Biome 設定解説

プロジェクトのコード品質を管理するツール [Biome](https://biomejs.dev/) の設定ファイル（`biome.json`）の各項目に関する解説です。

## 1. 全般設定

| 項目 | 設定値 | 解説 |
| :--- | :--- | :--- |
| `$schema` | `https://biomejs.dev/...` | エディタでの入力補完やバリデーションのためのスキーマ定義です。 |

### files (ファイル制御)
- **ignoreUnknown**: `false`  
  未知のファイル形式を無視せず、チェック(警告)対象とします。
- **maxSize**: `1048576` (1MB)  
  処理するファイルの最大サイズを1MBに制限し、パフォーマンスを維持します。
- **includes**:  
  チェック対象に含めるファイル、または除外する（`!`）ファイルを定義しています。`.next`, `node_modules`, `dist` などの生成物は除外されています。

## 2. Formatter (整形ルール)

共通のフォーマットルールです。

| 項目 | 設定値 | 解説 |
| :--- | :--- | :--- |
| **enabled** | `true` | フォーマッタを有効にします。 |
| **indentStyle** | `space` | インデントにスペースを使用します。 |
| **indentWidth** | `2` | インデントの幅を 2 に設定します。 |
| **lineEnding** | `lf` | 改行コードを LF に統一します。 |
| **lineWidth** | `80` | 1行の最大文字数を 80 に設定します。 |
| **bracketSameLine** | `false` | 閉じ括弧を新しい行に配置します。 |
| **bracketSpacing** | `true` | オブジェクトのリテラルなどの括弧内にスペースを入れます（例: `{ foo }`）。 |
| **expand** | `auto` | 必要に応じて要素を複数行に展開します。 |
| **trailingNewline** | `true` | ファイルの末尾に必ず改行を入れます。 |

### JavaScript / TypeScript 固有設定
- **quoteStyle**: `single`  
  文字列にはシングルクォート（`'`）を使用します。
- **jsxQuoteStyle**: `double`  
  JSX内の属性にはダブルクォート（`"`）を使用します。
- **semicolons**: `always`  
  文末に必ずセミコロンを付けます。
- **arrowParentheses**: `always`  
  アロー関数の引数に必ず括弧を付けます（例: `(x) => x`）。
- **quoteProperties**: `asNeeded`  
  オブジェクトのキーは必要な場合のみクォートで囲みます。
- **trailingCommas**: `all`  
  末尾のカンマを可能な限り付与します（複数行の配列やオブジェクトなど）。

### JSON 固有設定
- **parser.allowComments**: `false`  
  JSONファイル内でのコメントを許可しません。
- **formatter.trailingCommas**: `none`  
  JSONの標準仕様に従い、末尾のカンマを許可しません。

### CSS 固有設定
- **parser.tailwindDirectives**: `true`  
  `@tailwind` などの Tailwind CSS 独自のディレクティブを正しく解析します。
- **formatter.quoteStyle**: `double`  
  CSS内の文字列にはダブルクォートを使用します。

## 3. Linter (構文チェック)

| 項目 | 設定値 | 解説 |
| :--- | :--- | :--- |
| **enabled** | `true` | リンターを有効にします。 |
| **rules.recommended** | `true` | Biomeが推奨する標準的なルールセットをすべて適用します。 |

## 4. Assist (コーディング支援)

- **actions.source.organizeImports**: `on`  
  Import文の並び替え（ソート）と未使用Importの削除を自動で行います。

## 5. VCS (バージョン管理連携)

- **clientKind**: `git`  
  バージョン管理システムとして Git を使用することを指定します。
- **useIgnoreFile**: `true`  
  `.gitignore` で指定されたファイルをチェック対象から除外します。
- **defaultBranch**: `main`  
  プロジェクトのデフォルトブランチを `main` に設定します。
