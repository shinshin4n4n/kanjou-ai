# KanjouAI - Development Guide

> **グローバルルール**: `~/.claude/CLAUDE.md` を参照（言語設定・TDD・コミット規約・ブランチ戦略）

## Tech Stack

Next.js 16 (App Router) + React 19 / Supabase (PostgreSQL + Auth) / Zod 4 / Anthropic Claude API / Tailwind CSS 4 + lucide-react / Vitest 4 + Playwright / Biome

## Commands

| コマンド | 用途 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | ビルド |
| `npm run typecheck` | 型チェック |
| `npm run lint` | Lint (Biome) |
| `npm run test:unit` | Unit テスト (Vitest) |
| `npm run test:e2e` | E2E テスト (Playwright) |

## Critical Rules

1. **Server Actions は必ず `ApiResponse<T>` を返す**
2. **全エラーは `handleApiError()` で処理**
3. **テストカバレッジ 80%以上必須**
4. **`any` 型禁止**
5. **全テーブルで RLS 有効化**
6. **PRサイズ: 300行以下 / 10ファイル以下**（詳細は `.claude/task-checklists.md`）
7. **ページコンポーネントにユーザー操作がある場合、UIインタラクションテスト必須**

## Architecture & Guides

- アーキテクチャ詳細: `.claude/architecture.md`
- セキュリティ: `.claude/security.md`
- テスト: `.claude/testing.md`
- タスクチェックリスト: `.claude/task-checklists.md`
- パススコープ付きルール: `.claude/rules/`

## Version Policy

新規ライブラリは Context7 MCP で最新安定版を確認。exact version で固定（`^` `~` 不可）。

## Notes

- Supabase Auth 使用（NextAuth / better-auth は不使用）
- Zod 4・React 19・Next.js 16 の最新機能活用
- Server Actions 優先

## Compact Instructions

IMPORTANT: コンパクション時は以下を必ず保持すること:
- 変更済みファイルの完全リスト（パス付き）
- 現在の TDD フェーズ（RED/GREEN/REFACTOR）とテスト実行結果
- 未完了タスクと次のステップ
- 現在作業中の Issue 番号とブランチ名
- 重要な設計判断とその理由

---

**Document Version:** 2.0.0
**Last Updated:** 2026-04-04
