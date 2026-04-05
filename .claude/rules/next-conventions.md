---
description: Next.js App Router / React 規約とコードスタイル
paths:
  - "app/**"
---

# Next.js Conventions

## コンポーネント規約

- **Server Components First**: デフォルトは Server Component
- **Client Components**: `'use client'` ディレクティブを明示的に使用
- 状態管理: React hooks (useState, useEffect)
- データ取得: Server Actions を呼び出し

## Code Style

### TypeScript

- **strict mode** 有効
- `any` 型は禁止（型ガードを使用）
- Optional chaining (`?.`) を活用

### Lint & Format

- **Biome** (lint + format 統合)

### ファイル命名

- コンポーネント: PascalCase (`UserProfile.tsx`)
- ユーティリティ: kebab-case (`format-date.ts`)
- テスト: `{name}.test.ts`
- Server Actions: kebab-case (`transaction-actions.ts`)

## Avoid These Patterns

- ❌ `any` 型の使用
- ❌ クライアント側での直接 Supabase クエリ
- ❌ エラーの握りつぶし
- ❌ `console.log` の本番コード残留
- ❌ ハードコードされた文字列
- ❌ 巨大なコンポーネント
- ❌ グローバル状態の乱用

> 詳細: `.claude/architecture.md`
