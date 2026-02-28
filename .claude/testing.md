# Testing Guide

## TDD Red-Green-Refactor ワークフロー

全新機能は `/tdd` コマンドで以下のサイクルに従う:

```
1. 🔴 RED:      失敗するテストを書く → npm run test:unit で FAIL を確認
2. 🟢 GREEN:    テストを通す最小限の実装 → npm run test:unit で PASS を確認
3. 🔵 REFACTOR: テストが通る状態を維持しながらリファクタ → npm run test:unit で PASS を確認
```

### ルール

- テストを書く前に実装コードを書かない
- RED でテストが失敗することを確認してから GREEN に進む
- GREEN では最小限の実装のみ（きれいなコードは REFACTOR で）
- 1サイクルの粒度は 1メソッド / 1ユースケース単位
- テストに書いていない機能を追加しない

## テストファイル配置

```
{対象ファイルのパス}/__tests__/{ファイル名}.test.ts
```

| 対象 | テストファイル |
|------|-------------|
| `app/_actions/auth.ts` | `app/_actions/__tests__/auth.test.ts` |
| `app/_actions/profile.ts` | `app/_actions/__tests__/profile.test.ts` |
| `lib/auth.ts` | `lib/auth/__tests__/auth.test.ts` |
| `lib/api/error.ts` | `tests/unit/lib/__tests__/api-error.test.ts` |
| `lib/csv/parsers.ts` | `tests/unit/lib/__tests__/csv-parsers.test.ts` |
| `lib/validators/transaction.ts` | `lib/validators/__tests__/transaction.test.ts` |

## モックパターン

### Supabase Client モック

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock は import より前に巻き上げられる
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
const mockCreateClient = vi.mocked(createClient);
```

#### チェーン API のモック（SELECT）

```typescript
// supabase.from("table").select("cols").eq("id", value).single()
const mockSingle = vi.fn().mockResolvedValue({
  data: { display_name: "テスト", fiscal_year_start: 4, default_tax_rate: "tax_10" },
  error: null,
});
mockCreateClient.mockResolvedValue({
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ single: mockSingle }),
    }),
  }),
} as unknown as Awaited<ReturnType<typeof createClient>>);
```

#### チェーン API のモック（UPDATE）

```typescript
// supabase.from("table").update({...}).eq("id", value)
const mockEq = vi.fn().mockResolvedValue({ error: null });
mockCreateClient.mockResolvedValue({
  from: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnValue({ eq: mockEq }),
  }),
} as unknown as Awaited<ReturnType<typeof createClient>>);
```

#### Auth API のモック

```typescript
// supabase.auth.signInWithPassword / signUp / signOut / signInWithOAuth
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockSignInWithOAuth = vi.fn();

mockCreateClient.mockResolvedValue({
  auth: {
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    signOut: mockSignOut,
    signInWithOAuth: mockSignInWithOAuth,
  },
} as unknown as Awaited<ReturnType<typeof createClient>>);
```

### Auth モック（requireAuth）

```typescript
vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(),
}));

import { requireAuth } from "@/lib/auth";
const mockRequireAuth = vi.mocked(requireAuth);

// 認証済み
mockRequireAuth.mockResolvedValue({
  success: true,
  data: { id: "user-123" } as never,
});

// 未認証
mockRequireAuth.mockResolvedValue({
  success: false,
  error: "ログインが必要です。",
  code: "UNAUTHORIZED",
});
```

### next/cache モック

```typescript
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
```

## AAA パターン（Arrange-Act-Assert）

```typescript
it("正常にプロフィールを更新できる", async () => {
  // Arrange: モックとテストデータを準備
  mockRequireAuth.mockResolvedValue({
    success: true,
    data: { id: "user-123" } as never,
  });
  const mockEq = vi.fn().mockResolvedValue({ error: null });
  mockCreateClient.mockResolvedValue({
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: mockEq }),
    }),
  } as unknown as Awaited<ReturnType<typeof createClient>>);

  // Act: テスト対象を実行
  const result = await updateProfile(
    createFormData({
      displayName: "テストユーザー",
      fiscalYearStart: "4",
      defaultTaxRate: "tax_10",
    }),
  );

  // Assert: 結果を検証
  expect(result.success).toBe(true);
});
```

## FormData ヘルパー

Server Action のテストでは `FormData` を組み立てるヘルパーを使う:

```typescript
function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value);
  }
  return fd;
}
```

## テストケースの網羅パターン

### Server Action テスト

1. **正常系**: 有効な入力で成功
2. **バリデーションエラー**: 不正な入力で `VALIDATION_ERROR`
3. **未認証**: `requireAuth()` が失敗 → `UNAUTHORIZED`
4. **DB エラー**: Supabase がエラーを返す（RLS 違反, 重複等）
5. **エラー情報非漏洩**: 内部メッセージがレスポンスに含まれないこと

```typescript
// エラー情報非漏洩の検証例
it("DB更新エラー時にエラーを返す", async () => {
  const mockEq = vi.fn().mockResolvedValue({
    error: { code: "42501", message: "RLS violation" },
  });
  // ...

  const result = await updateProfile(createFormData({...}));

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error).not.toContain("RLS violation");  // 内部情報が漏れない
  }
});
```

### バリデーションテスト

1. **正常な入力**: 全フィールド有効
2. **境界値**: min/max の境界（e.g., 会計年度 0, 1, 12, 13）
3. **型変換**: 文字列→数値、トリム処理
4. **オプショナル**: 省略可能フィールドの未指定

## カバレッジ要件

### 閾値（vitest.config.ts）

```
statements: 80%
branches:   75%
functions:  80%
lines:      80%
```

### カバレッジ対象

```
include: lib/**/*.ts, lib/**/*.tsx, app/**/*.ts, app/**/*.tsx
```

### カバレッジ除外

```
exclude:
  - lib/types/**           # 型定義（ロジックなし）
  - lib/**/*.d.ts          # 型宣言ファイル
  - lib/utils/constants.ts # 定数定義（ロジックなし）
  - lib/supabase/**        # Supabase クライアント初期化（環境依存）
  - app/**/page.tsx        # ページコンポーネント（UI、E2E でカバー）
  - app/**/layout.tsx      # レイアウト（UI、E2E でカバー）
  - app/**/route.ts        # Route Handler（統合テストでカバー）
```

### コマンド

```bash
npm run test:unit            # テスト実行
npm run test:unit:coverage   # カバレッジ付きで実行
```

## beforeEach パターン

```typescript
beforeEach(() => {
  vi.clearAllMocks();  // 全モックをリセット（各テストの独立性を保証）
});
```

## Type Narrowing パターン

`ApiResponse<T>` の型ガードでテスト:

```typescript
const result = await someAction(formData);

expect(result.success).toBe(false);
if (!result.success) {
  // TypeScript が error と code の存在を認識
  expect(result.code).toBe("VALIDATION_ERROR");
  expect(result.error).toBe("...");
}
```
