# 本番環境セットアップ手順

## 1. Supabase 本番プロジェクト

### プロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard) でプロジェクト作成
2. リージョン: `Northeast Asia (Tokyo)` 推奨
3. データベースパスワードを安全に保管

### マイグレーション適用

```bash
# Supabase CLI でリモートに接続
npx supabase link --project-ref <PROJECT_REF>

# マイグレーション適用
npx supabase db push

# シードデータ投入（初回のみ。既存データがある場合は実行しない）
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

### RLS 確認

Supabase Dashboard > Authentication > Policies で全テーブルの RLS が有効であることを確認:

- `profiles` — ユーザーは自分のプロフィールのみ CRUD 可能
- `transactions` — ユーザーは自分の取引のみ CRUD 可能
- `import_logs` — ユーザーは自分のインポート履歴のみ参照可能
- `account_categories` — 全ユーザーが参照可能（マスタデータ）

## 2. Vercel 環境変数

Vercel Dashboard > Settings > Environment Variables に以下を設定:

| 変数名 | スコープ | 説明 |
|--------|---------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | Supabase Service Role Key |
| `ANTHROPIC_API_KEY` | Production | Claude API Key |

## 3. Google OAuth 設定

### Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. OAuth 同意画面を設定（外部、公開ステータス）
3. OAuth 2.0 クライアント ID を作成:
   - アプリケーションの種類: Web アプリケーション
   - 承認済みリダイレクト URI: `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`

### Supabase Provider 設定

1. Supabase Dashboard > Authentication > Providers > Google
2. Client ID と Client Secret を入力
3. `app/login/page.tsx` の Google ログインボタンのコメントアウトを解除

## 4. E2E テスト用 Vercel Protection Bypass

Vercel の Deployment Protection が有効な場合、CI の E2E テストが Preview デプロイにアクセスできるよう Bypass を設定する。

### Vercel Dashboard

1. Vercel Dashboard > Settings > Deployment Protection
2. 「Protection Bypass for Automation」を有効化
3. 生成された Secret をコピー

### GitHub Secrets

```bash
echo "<コピーした Secret>" | gh secret set VERCEL_AUTOMATION_BYPASS_SECRET
```

Playwright が `x-vercel-protection-bypass` ヘッダーを自動付与し、Preview デプロイの認証をバイパスする。

## 5. 動作確認チェックリスト

- [ ] メール/パスワードでサインアップ・ログインができる
- [ ] Google OAuth でログインができる
- [ ] 取引の作成・編集・削除ができる
- [ ] CSV インポートが正常に動作する
- [ ] AI 仕訳推定が実行できる
- [ ] エクスポートが正常にダウンロードされる
- [ ] 他ユーザーのデータにアクセスできないことを確認（RLS）
