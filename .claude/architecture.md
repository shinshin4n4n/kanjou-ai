# Architecture Guide

## File Structure

```
app/
├── layout.tsx                    # Root layout (Server Component)
├── page.tsx                      # Landing page
├── login/
│   └── page.tsx                  # ログイン/サインアップ画面 (Client Component)
├── dashboard/
│   └── page.tsx                  # ダッシュボード (Server Component)
├── settings/
│   └── page.tsx                  # プロフィール設定 (Client Component)
├── auth/
│   └── callback/
│       └── route.ts              # OAuth コールバック (Route Handler)
└── _actions/
    ├── auth.ts                   # 認証 Server Actions (signIn, signUp, signInWithGoogle, signOut)
    ├── profile.ts                # プロフィール Server Actions (getProfile, updateProfile)
    └── __tests__/
        ├── auth.test.ts          # 認証テスト (9 cases)
        └── profile.test.ts       # プロフィールテスト (8 cases)

lib/
├── api/
│   └── error.ts                  # handleApiError() + ApiError クラス + エラーコード定数
├── auth.ts                       # getUser(), requireAuth()
├── auth/
│   └── __tests__/
│       └── auth.test.ts          # 認証ユーティリティテスト (7 cases)
├── csv/
│   └── parsers.ts                # CSV パーサー (Wise, Revolut, generic)
├── supabase/
│   ├── server.ts                 # createServerClient (Server Component / Server Action 用)
│   ├── client.ts                 # createBrowserClient (Client Component 用)
│   └── middleware.ts             # セッション更新 + 認証リダイレクト
├── types/
│   ├── api.ts                    # ApiResponse<T> 型定義
│   └── supabase.ts               # Supabase 自動生成型 (npx supabase gen types)
├── validators/
│   ├── auth.ts                   # loginSchema, signupSchema
│   ├── profile.ts                # updateProfileSchema
│   ├── transaction.ts            # createTransactionSchema, aiClassifyRequestSchema
│   └── __tests__/
│       └── transaction.test.ts   # バリデーションテスト (12 cases)
└── utils/
    └── constants.ts              # 勘定科目, 税区分, アップロード/レート制限

middleware.ts                     # Next.js Middleware エントリポイント → updateSession()
vitest.config.ts                  # Vitest 設定 (jsdom, v8 coverage, 80% threshold)
```

## Server Actions パターン

### 基本構造

`app/_actions/auth.ts` をベースとした標準パターン:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { handleApiError } from "@/lib/api/error";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/lib/types/api";
import { someSchema } from "@/lib/validators/some-domain";

export async function someAction(formData: FormData): Promise<ApiResponse<T>> {
  try {
    // 1. 認証チェック（必要な場合）
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    // 2. Zod バリデーション
    const parsed = someSchema.safeParse({
      field: formData.get("field"),
    });
    if (!parsed.success) {
      return {
        success: false,
        error: "ユーザー向けエラーメッセージ",
        code: "VALIDATION_ERROR",
      };
    }

    // 3. Supabase 操作
    const supabase = await createClient();
    const { error } = await supabase.from("table").insert({...});
    if (error) return handleApiError(error);

    // 4. キャッシュ無効化 + 成功レスポンス
    revalidatePath("/path");
    return { success: true, data: null };
  } catch (error) {
    return handleApiError(error);
  }
}
```

### ルール

- 必ず `"use server"` ディレクティブを付ける
- 戻り値は必ず `ApiResponse<T>`
- `try-catch` で囲み、catch では `handleApiError(error)` を返す
- Zod の `safeParse` を使い、`!parsed.success` で早期リターン
- Zod のエラー詳細はクライアントに返さない（固定メッセージを使う）
- データ変更後は `revalidatePath()` を呼ぶ
- 認証が必要なアクションは冒頭で `requireAuth()` を呼ぶ

### 認証ユーティリティ

```typescript
// lib/auth.ts
import { createClient } from "@/lib/supabase/server";

// ユーザー取得（null 許容）— Server Component での分岐用
export async function getUser(): Promise<User | null>

// 認証必須（ApiResponse 形式）— Server Action でのガード用
export async function requireAuth(): Promise<ApiResponse<User>>
```

## Database Patterns

### テーブル構成

| テーブル | 用途 | RLS |
|---------|------|-----|
| profiles | ユーザープロフィール（auth.users と 1:1） | `auth.uid() = id` |
| account_categories | 勘定科目マスタ（システム + ユーザーカスタム） | `user_id IS NULL OR auth.uid() = user_id` |
| transactions | 仕訳データ | `auth.uid() = user_id` |
| import_logs | CSV インポート履歴 | `auth.uid() = user_id` |
| csv_mappings | CSV カラムマッピング設定 | `auth.uid() = user_id` |

### RLS ポリシーパターン

全テーブルで `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` を有効化。

```sql
-- 基本パターン: 自分のデータのみアクセス可能
CREATE POLICY "table_select_own" ON table FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "table_insert_own" ON table FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "table_update_own" ON table FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL);
```

### Soft Delete

- `deleted_at TIMESTAMPTZ` カラムで論理削除
- SELECT ポリシーに `deleted_at IS NULL` 条件を含める
- 物理削除は行わない

### 金額

- `INT` 型（円単位、小数を避ける）
- `CHECK (amount > 0)` 制約
- 外貨の場合は `original_amount NUMERIC` + `exchange_rate NUMERIC` を別途保持

### 自動トリガー

- `update_updated_at()`: UPDATE 時に `updated_at` を自動更新
- `handle_new_user()`: `auth.users` への INSERT 時に `profiles` を自動作成（`SECURITY DEFINER`）

## Data Flow

### Server Component → Server Action → Supabase

```
[Client Component]
  │ form action={serverAction}  or  onClick → serverAction(formData)
  ▼
[Server Action] (app/_actions/*.ts)
  │ 1. requireAuth() — 認証チェック
  │ 2. zodSchema.safeParse() — 入力バリデーション
  │ 3. supabase.from("table").insert/update/select()
  │ 4. revalidatePath() — キャッシュ無効化
  │ 5. return ApiResponse<T>
  ▼
[Client Component]
  │ result.success ? 成功表示 : エラー表示
```

### Server Component でのデータ取得

```
[Server Component] (app/dashboard/page.tsx)
  │ const user = await getUser()  — Cookie ベースで認証
  │ if (!user) redirect("/login")
  │ const supabase = await createClient()
  │ const { data } = await supabase.from("table").select()
  ▼
[JSX レンダリング]
```

### OAuth フロー

```
[Login Page] signInWithGoogle()
  → Supabase OAuth URL 取得
  → window.location.href でリダイレクト
  → Google 認証画面
  → /auth/callback?code=xxx
  → [Route Handler] exchangeCodeForSession(code)
  → redirect("/dashboard")
```

## Error Handling Flow

### ApiResponse<T> 型

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
```

### handleApiError() の分岐

```
[error]
  ├── ApiError           → { error: error.message, code: error.code }
  ├── ZodError (issues)  → { error: "入力内容を確認してください。", code: "VALIDATION_ERROR" }
  ├── Supabase 42501     → { error: "この操作を行う権限がありません。", code: "FORBIDDEN" }
  ├── Supabase 23505     → { error: "この項目は既に存在します。", code: "CONFLICT" }
  ├── Supabase その他     → { error: "データベースエラーが発生しました。", code: "INTERNAL_ERROR" }
  └── unknown            → { error: "予期しないエラーが発生しました。", code: "INTERNAL_ERROR" }
```

### エラーコード一覧

```typescript
// lib/api/error.ts
const API_ERROR_CODES = {
  UNAUTHORIZED,       // 未認証
  FORBIDDEN,          // 権限なし (RLS 違反)
  NOT_FOUND,          // リソース未検出
  VALIDATION_ERROR,   // 入力バリデーション失敗
  CONFLICT,           // 重複 (UNIQUE 制約違反)
  RATE_LIMIT,         // レート制限超過
  AI_ERROR,           // Claude API エラー
  CSV_PARSE_ERROR,    // CSV パースエラー
  EXPORT_ERROR,       // エクスポートエラー
  INTERNAL_ERROR,     // その他の内部エラー
};
```
