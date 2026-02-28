# KanjouAI - Development Guide

このドキュメントは、Claude Code がこのプロジェクトを理解し、一貫性のあるコード提案を行うためのコアガイドです。

## Tech Stack

- **Frontend**: Next.js 16 App Router + React 19
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Auth**: Email/Password + Google OAuth (Supabase Auth)
- **Validation**: Zod 4
- **AI**: Anthropic Claude API (仕訳推定)
- **Styling**: Tailwind CSS 4 + lucide-react
- **Testing**: Vitest 4 (Unit) + Playwright (E2E)
- **Linter/Formatter**: Biome

## 🚨 Critical Rules (Must Follow)

1. **Server Actions は必ず `ApiResponse<T>` を返す**
2. **全エラーは `handleApiError()` で処理**
3. **TDD必須: テストを先に書いてから実装**（Red-Green-Refactor）
4. **テストカバレッジ 80%以上必須**
5. **`any` 型禁止**
6. **全テーブルで RLS 有効化**
7. **PRサイズ: 300行以下 / 10ファイル以下**（詳細は `.claude/task-checklists.md`）
8. **Plan mode で推定サイズを記載**（300行超は分割計画必須）
9. **PR作成前に `git diff --stat` でサイズ確認**（超過時はPR作成中断）
10. **新規ライブラリ導入時は Context7 MCP で最新版確認**

## Architecture Patterns

### Server Actions

- **配置**: `app/_actions/{domain}.ts`
- **戻り値**: 必ず `ApiResponse<T>` を返す
- **エラーハンドリング**: `lib/api/error.ts` の `handleApiError()` を使用

### Database

- **RLS**: 全テーブルで有効化
- **Soft Delete**: `deleted_at IS NULL` パターン使用
- **金額**: INTEGER（円単位、小数を避ける）

### Client Components

- **'use client'** ディレクティブを明示的に使用
- **状態管理**: React hooks (useState, useEffect)
- **データ取得**: Server Actions を呼び出し

## Security

### エラーハンドリング

- ❌ エラーレスポンスに `details`, `stack` を含めない
- ❌ ユーザーのメールアドレスや個人情報をログに出力しない
- ✅ 全エラーは `handleApiError()` で処理

### ログ出力

- 本番環境では `console.log` を使わない
- `console.error`, `console.warn` のみ使用

### 認証

- **認証チェック**: `lib/auth.ts` の `getUser()`, `requireAuth()` を使用

## Testing（TDD必須）

新機能の実装は **必ず Red-Green-Refactor サイクル** に従うこと。

### TDD ワークフロー（全機能に適用）

```
1. 🔴 RED:   失敗するテストを先に書く
2. 🟢 GREEN: テストを通す最小限の実装を書く
3. 🔵 REFACTOR: テストが通る状態を維持しながらリファクタ
```

- テストを書く前に実装コードを書かない
- テストが失敗することを確認してから実装に進む
- 1サイクルの粒度は小さく（1メソッド/1ユースケース単位）
- `/tdd` コマンドで TDD サイクルを開始

### Unit Testing (Vitest)

- **カバレッジ**: 80%以上必須
- **実行**: `npm run test:unit`
- **配置**: `{対象ファイルのパス}/__tests__/{ファイル名}.test.ts`
- **パターン**: AAA（Arrange-Act-Assert）

### E2E Testing (Playwright)

- **実行**: `npm run test:e2e`
- **配置**: `tests/e2e/{feature}.spec.ts`

### CI

- 全テスト通過が必須
- `continue-on-error` は使わない
- TypeScript 型チェックも必須

## Code Style

### TypeScript

- **strict mode** 有効
- `any` 型は禁止（型ガードを使用）
- Optional chaining (`?.`) を活用

### Commits

- **Conventional Commits** 形式
  - `feat:` / `fix:` / `refactor:` / `test:` / `docs:` / `chore:`

### Lint & Format

- **Biome** (lint + format 統合)

### ファイル命名

- **コンポーネント**: PascalCase (`UserProfile.tsx`)
- **ユーティリティ**: kebab-case (`format-date.ts`)
- **テスト**: `{name}.test.ts`
- **Server Actions**: kebab-case (`transaction-actions.ts`)

## Common Patterns

```typescript
// Supabase Client (Server)
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// Supabase Client (Client)
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// Claude API (Always server-side)
import { classifyTransactions } from "@/lib/claude/client";
const results = await classifyTransactions(transactions);
```

## Task Guidelines

- コード例: `.claude/examples.md` を参照
- タスクチェックリスト: `.claude/task-checklists.md` を参照

## Best Practices

1. **Server Components First**: デフォルトは Server Component
2. **Type Safety**: `ApiResponse<T>` で統一
3. **Error Handling**: 必ず `try-catch` + `handleApiError()`
4. **Validation**: Zod で入力バリデーション
5. **RLS**: データベースアクセスは RLS で保護
6. **Revalidation**: データ更新後は `revalidatePath()` を呼ぶ
7. **Testing**: 新機能には必ずテストを追加

## Avoid These Patterns

- ❌ `any` 型の使用
- ❌ クライアント側での直接Supabaseクエリ
- ❌ エラーの握りつぶし
- ❌ `console.log` の本番コード残留
- ❌ ハードコードされた文字列
- ❌ 巨大なコンポーネント
- ❌ グローバル状態の乱用

## Version Policy

- 新規ライブラリ導入時は **Context7 MCP で最新安定版を確認**
- `@latest` でインストール後、exact version で固定
- `package.json` に `^` や `~` を使わない

### Context7 MCP セットアップ（Claude Code 初回のみ）

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

使用方法: プロンプトに `use context7` を追加する

```
Supabaseの最新の認証実装方法を教えて。use context7
```

## Notes

- **Supabase Auth** を使用（NextAuth / better-auth は不使用）
- **Zod 4** を使用（v3 ではない）
- **React 19** と **Next.js 16** の最新機能活用
- **Server Actions** 優先

---

**Document Version:** 1.0.0
**Last Updated:** 2026-02-28
**Next Review:** 2026-05-28
