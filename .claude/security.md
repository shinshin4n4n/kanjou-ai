# Security Guide

## handleApiError による情報漏洩防止

`lib/api/error.ts` の `handleApiError()` が全エラーを一元処理し、内部情報の漏洩を防ぐ。

### 原則

- Zod バリデーションエラーの詳細（`issues` 配列）をクライアントに返さない
- Supabase のエラーメッセージ（テーブル名、カラム名、SQL ステート）を露出しない
- スタックトレースをレスポンスに含めない
- `console.error` でサーバーログに記録するが、ユーザー PII（メール等）は含めない

### 実装パターン

```typescript
// ✅ 正しい: 固定メッセージを返す
if (!parsed.success) {
  return {
    success: false,
    error: "メールアドレスとパスワードを正しく入力してください。",
    code: "VALIDATION_ERROR",
  };
}

// ❌ 間違い: Zod のエラー詳細をそのまま返す
if (!parsed.success) {
  return {
    success: false,
    error: parsed.error.issues.map(i => i.message).join(", "),
    code: "VALIDATION_ERROR",
  };
}
```

### Supabase エラーの変換

```typescript
// handleApiError 内部での処理:
// PostgreSQL 42501 (RLS 違反) → "この操作を行う権限がありません。"
// PostgreSQL 23505 (UNIQUE 違反) → "この項目は既に存在します。"
// その他の DB エラー → "データベースエラーが発生しました。"
// 不明なエラー → "予期しないエラーが発生しました。"
```

### テストでの検証

テストでは内部メッセージが漏れていないことを必ず確認する:

```typescript
// tests/unit/lib/__tests__/api-error.test.ts より
expect(result.error).not.toContain("row-level security");
expect(result.error).not.toContain("secret");
expect(result.error).not.toContain("Invalid login credentials");
```

## Supabase Auth + Middleware のセッション管理

### アーキテクチャ

```
[Browser] → [Next.js Middleware] → [Server Component / Server Action]
              │
              ├── updateSession(): セッション Cookie を更新
              ├── 未認証 + 非公開パス → /login にリダイレクト
              └── 公開パス: /, /login, /signup, /auth/callback
```

### Middleware (middleware.ts → lib/supabase/middleware.ts)

```typescript
// matcher で静的アセットを除外
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- `updateSession()` が毎リクエストで Supabase セッションを更新
- Cookie ベースのセッション管理（`@supabase/ssr` の `createServerClient`）
- Cookie の getAll/setAll を Request/Response オブジェクト経由で処理

### 認証チェックの使い分け

| 関数 | 用途 | 戻り値 |
|------|------|--------|
| `getUser()` | Server Component での分岐 | `User \| null` |
| `requireAuth()` | Server Action でのガード | `ApiResponse<User>` |

```typescript
// Server Component
const user = await getUser();
if (!user) redirect("/login");

// Server Action
const authResult = await requireAuth();
if (!authResult.success) return authResult;  // 早期リターンで UNAUTHORIZED を返す
const userId = authResult.data.id;
```

### Supabase Client の使い分け

| クライアント | ファイル | 用途 |
|------------|---------|------|
| `createClient()` (server) | `lib/supabase/server.ts` | Server Component, Server Action |
| `createClient()` (client) | `lib/supabase/client.ts` | Client Component（極力使わない） |

- Server 側は `cookies()` から Cookie を取得
- Client Component から直接 Supabase クエリは原則禁止（Server Action 経由）

## RLS ポリシー

### 全テーブル共通ルール

1. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` を必ず有効化
2. `auth.uid() = user_id` で自分のデータのみアクセス可能
3. SELECT/UPDATE で `deleted_at IS NULL` 条件を含める（Soft Delete 対応）
4. INSERT では `WITH CHECK (auth.uid() = user_id)` で所有者チェック

### テーブル別ポリシー

**profiles**: `auth.uid() = id`（profiles.id = auth.users.id）
- SELECT: own + not deleted
- INSERT: own
- UPDATE: own + not deleted
- DELETE: なし（Soft Delete のみ）

**account_categories**: システムプリセット（`user_id IS NULL`）は全員参照可
- SELECT: `user_id IS NULL OR auth.uid() = user_id`
- INSERT/UPDATE/DELETE: `auth.uid() = user_id`

**transactions, import_logs, csv_mappings**: 標準パターン
- SELECT: `auth.uid() = user_id [AND deleted_at IS NULL]`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id [AND deleted_at IS NULL]`
- DELETE: `auth.uid() = user_id`

### RLS 違反のハンドリング

Supabase が返す PostgreSQL エラーコード `42501` を `handleApiError()` が捕捉し、
`FORBIDDEN` コードと汎用メッセージに変換する。RLS ポリシー名やテーブル名は露出しない。

## 環境変数管理

### NEXT_PUBLIC_ の使い分け

| 変数 | プレフィックス | 理由 |
|------|--------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_` | クライアント/サーバー両方で使用（公開情報） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_` | クライアント/サーバー両方で使用（公開キー、RLS で保護） |
| `SUPABASE_SERVICE_ROLE_KEY` | なし | サーバーのみ（RLS バイパス権限、絶対に露出させない） |
| `ANTHROPIC_API_KEY` | なし | サーバーのみ（Claude API 秘密鍵） |

### 注意点

- `NEXT_PUBLIC_` 付きの変数はブラウザに配信される
- Anon Key は公開前提だが、RLS で保護されているため安全
- Service Role Key はサーバー専用（Admin 操作用）。Client Component や公開コードに含めない
- 環境変数の Non-null assertion には `biome-ignore` コメントを付与

## 脆弱性パターンと対策

### IDOR (Insecure Direct Object Reference)

**リスク**: 他人の `user_id` を指定してデータにアクセス

**対策**: RLS が DB レベルで防御。アプリケーションコードでも `requireAuth()` で取得した `user_id` のみを使用。

```typescript
// ✅ 正しい: 認証済みユーザーの ID を使う
const authResult = await requireAuth();
const { data } = await supabase
  .from("transactions")
  .select()
  .eq("user_id", authResult.data.id);  // RLS + アプリケーションレベルで二重防御

// ❌ 間違い: リクエストから受け取った ID をそのまま使う
const userId = formData.get("userId");
const { data } = await supabase
  .from("transactions")
  .select()
  .eq("user_id", userId);  // IDOR 脆弱性
```

### Mass Assignment

**リスク**: FormData に意図しないフィールドが含まれ、予期しないカラムが更新される

**対策**: Zod スキーマで許可するフィールドを明示的に定義。`safeParse()` が未定義フィールドを除去。

```typescript
// Zod スキーマが許可するフィールドのみ通す
const parsed = updateProfileSchema.safeParse({
  displayName: formData.get("displayName") || undefined,
  fiscalYearStart: Number(formData.get("fiscalYearStart")),
  defaultTaxRate: formData.get("defaultTaxRate"),
});

// parsed.data には定義済みフィールドのみ含まれる
await supabase.from("profiles").update({
  display_name: parsed.data.displayName ?? null,
  fiscal_year_start: parsed.data.fiscalYearStart,
  default_tax_rate: parsed.data.defaultTaxRate,
  // ↑ is_admin や role などの不正フィールドは含まれない
});
```

### XSS (Cross-Site Scripting)

**対策**: React がデフォルトで JSX 出力をエスケープ。`dangerouslySetInnerHTML` は使用しない。

### SQL Injection

**対策**: Supabase Client SDK がパラメータ化クエリを使用。生 SQL は使わない。

### CSRF (Cross-Site Request Forgery)

**対策**: Next.js Server Actions は POST + Origin ヘッダー検証を組み込み済み。

### ログ出力ルール

```typescript
// ✅ 許可
console.error("[handleApiError] Unexpected error:", error);
console.warn("Rate limit approaching for action:", actionName);

// ❌ 禁止
console.log("User email:", user.email);   // PII 漏洩
console.log("Processing...");             // 本番 console.log 禁止
console.error("Error for user:", email);  // PII をログに含めない
```
