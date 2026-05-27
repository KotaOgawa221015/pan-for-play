# Vercel Cron メンテナンス保護・運用仕様書

本ドキュメントは、保持期限ベースのデータメンテナンスにおける「実行定義」「認証経路」「設定管理」「検証運用」の4要素をMECE（漏れなく・ダブりなく）に整理した仕様書である。

## 1. 実行定義（What & When）

### 実行スケジュール

* 構成定義: [vercel.json](vercel.json#L1) 内の crons 設定
* スケジュール: 0 3 * * *（UTC基準 毎日03:00 / JST 12:00）

### クリーンアップ対象（一回あたりの削除上限・日数は内部定数で固定）

* 30日を経過した InventoryStatusChange の論理削除データのクリーニング
* 30日を経過した deletedAt を持つ Fridge の物理削除
* 30日を経過した deletedAt を持つ User の物理削除

## 2. 認証・実行経路（How & Who）

### 通信経路

- Vercel Cronシステム ➔ GET /api/cron/maintenance を呼び出し
- リクエストヘッダー: Authorization: Bearer <CRON_SECRET> がVercelにより自動付与

### 検証ロジック（実装: [src/app/api/cron/maintenance/route.ts](src/app/api/cron/maintenance/route.ts)）

参照: [src/lib/environment.ts](src/lib/environment.ts#L1) (getCronSecret)、[src/features/retention/cleanup.ts](src/features/retention/cleanup.ts#L1) (runRetentionCleanup)

```typescript
import { runRetentionCleanup } from '@/features/retention/cleanup';
import { getCronSecret } from '@/lib/environment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(request: Request) {
  const authorization = request.headers.get('authorization');
  const cronSecret = getCronSecret();
  return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json(
      { ok: false, error: 'Unauthorized' },
      {
        status: 401,
      },
    );
  }

  const result = await runRetentionCleanup();
  return Response.json({
    ok: true,
    ...result,
  });
}
```

## 3. 設定・管理（Setup & Security）

### 鍵の生成

* Vercelによる自動発行は行われないため、開発者が手動で生成する。
* 推奨コマンド:
```bash
openssl rand -base64 32
```

(16文字以上の推測困難な文字列であれば、パスワードジェネレータの利用も可)

### 環境変数の配置

* 登録場所: Vercel Project設定（Settings > Environment Variables）
* キー名: CRON_SECRET
* セキュリティ制約: 漏洩防止のため、.env.example やソースコード上への記述・Gitコミットは厳禁とする。

## 4. 検証・手動運用（Test & Operation）

### 運用の原則

* メンテナンスの実行経路はVercel Cronに一元化する。
* 管理画面UIおよびサーバーアクション経由の手動実行導線は除外する。

### 本番環境での手動実行（緊急時・デバッグ用）

* 通常のアクセス（ヘッダーなし）は 401 Unauthorized で拒否されるため、curl を用いて認証ヘッダーを明示的に付与する。
```bash
curl -H "Authorization: Bearer 【Vercelに登録したCRON_SECRETの値】" \
  https://【本番ドメイン】/api/cron/maintenance
```

### ローカル開発環境での動作テスト

1. ローカル用の環境変数ファイル（.env.local）に、検証用の任意のシークレットを定義する。
```bash
CRON_SECRET=local_development_secret_token
```

2. ローカルサーバー（localhost:3000）を起動し、ヘッダー付きリクエストを送信して挙動を検証する。
```bash
curl -H "Authorization: Bearer local_development_secret_token" \
  http://localhost:3000/api/cron/maintenance
```
