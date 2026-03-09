# KanjouAI（勘定AI）

フリーランスの確定申告仕訳を AI で一括処理する Web アプリケーション。

**Demo**: https://kanjou-ai.vercel.app

## Screenshots

<!-- TODO: スクリーンショットを追加 -->

## 主な機能

- **CSV インポート** — Wise / Revolut / SMBC / 楽天カード / 汎用 CSV に対応。フォーマット自動判定
- **AI 仕訳推定** — Claude API が取引内容から勘定科目・税区分を自動推定
- **確認ワークフロー** — 推定結果を確信度バッジ付きで表示し、一括承認・個別修正が可能
- **エクスポート** — 弥生会計・freee・汎用 CSV 形式でダウンロード
- **データ保護** — Row Level Security で全テーブルのアクセスをユーザー単位に制限

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| Frontend | Next.js 16 (App Router) + React 19 |
| Backend | Supabase (PostgreSQL + Auth)（Google OAuth 対応予定） |
| AI | Claude API (Anthropic) |
| Validation | Zod 4 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Testing | Vitest 4 (Unit) + Playwright (E2E) |
| Linter/Formatter | Biome |
| CI/CD | GitHub Actions + Vercel |

## 技術選定理由

| 技術 | 選定理由 |
|------|---------|
| **Next.js 16 App Router** | Server Actions でフロント・バックを統一。API Routes 不要でコード量削減 |
| **Supabase** | PostgreSQL + Auth + RLS を一括提供。Firebase 代替としてオープンソース |
| **Claude API** | 日本語の仕訳推定に強い。構造化出力で勘定科目・税区分を安定抽出 |
| **Zod 4** | ランタイムバリデーション + TypeScript 型推論の統合。Server Actions の入口で必須 |
| **Biome** | ESLint + Prettier を単一ツールで置換。高速かつ設定が少ない |
| **Vitest** | Vite ベースで高速。Jest 互換 API で移行コスト低 |

## アーキテクチャ

```
Browser → Server Action → Supabase (RLS)
              ↓
         Claude API (AI推定)
```

- **Server Actions** (`app/_actions/*.ts`) — 全て `ApiResponse<T>` を返却。エラーは `handleApiError()` で一元処理
- **Row Level Security** — 全テーブルで有効。`auth.uid()` ベースのポリシーでデータ分離
- **TDD** — Red-Green-Refactor サイクルを徹底。カバレッジ 80% 以上必須

## セットアップ

```bash
# クローン
git clone https://github.com/shinshin4n4n/kanjou-ai.git && cd kanjou-ai

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.local を編集して Supabase / Anthropic の値を設定

# Supabase ローカル起動
npx supabase start
npx supabase db reset

# 開発サーバー起動
npm run dev
```

## 開発コマンド

| コマンド | 用途 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run lint` | Biome による lint + format チェック |
| `npm run typecheck` | TypeScript 型チェック |
| `npm run test:unit` | Vitest ユニットテスト |
| `npm run test:e2e` | Playwright E2E テスト |

## プロジェクトルール

- **TDD 必須**: テストを先に書いてから実装（Red-Green-Refactor）
- **PR サイズ**: 300 行以下 / 10 ファイル以下
- **テストカバレッジ**: 80% 以上
- **RLS**: 全テーブルで有効化
- **Server Actions**: Zod バリデーション + `ApiResponse<T>` + `handleApiError()`
- **バージョン管理**: exact version で固定（`^` / `~` 不使用）

## セキュリティ

セキュリティ方針は [SECURITY.md](./SECURITY.md) を参照してください。

## ライセンス

MIT
