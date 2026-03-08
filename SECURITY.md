# Security Policy

## 概要

KanjouAI はフリーランスの会計データを扱うため、セキュリティを最優先に設計しています。

## 認証・認可

- **Supabase Auth** によるメール/パスワード + Google OAuth 認証
- **Middleware** でセッション検証。未認証ユーザーはログインページにリダイレクト
- Server Actions は `requireAuth()` で認証チェック必須

## データ保護

- **Row Level Security (RLS)**: 全テーブルで有効。`auth.uid()` に基づくポリシーでユーザーデータを分離
- **Soft Delete**: `deleted_at IS NULL` パターンで論理削除。物理削除は行わない
- **金額**: INTEGER 型（円単位）で小数誤差を排除

## 入力バリデーション

- **Zod 4** で全ての Server Action 入力をバリデーション
- バリデーションエラーの詳細（フィールド名、制約条件）はクライアントに返さない

## エラーハンドリング

- `handleApiError()` で全エラーを一元処理
- スタックトレース、テーブル名、SQL ステート等の内部情報はレスポンスに含めない
- `console.error` でサーバーログに記録するが、ユーザー PII は含めない

## セキュリティヘッダー

`next.config.ts` で以下のヘッダーを設定:

- `Strict-Transport-Security` (HSTS + preload)
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` (Supabase / Anthropic API のみ許可)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (カメラ・マイク・位置情報を無効化)

## 環境変数

- `NEXT_PUBLIC_` プレフィックス付きの変数のみブラウザに露出
- シークレットキー（`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`）はサーバーサイドのみ
- `.env.example` にテンプレートを提供。実際の値はコミットしない

## 脆弱性の報告

セキュリティに関する問題を発見した場合は、GitHub Issues で報告してください。
