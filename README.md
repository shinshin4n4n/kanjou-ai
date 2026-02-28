# KanjouAI（勘定AI）

フリーランスの確定申告仕訳をAIで一括処理するWebアプリケーション。

## 特徴

- 📝 取引データの手動入力・CSV一括インポート（Wise / Revolut / 汎用CSV対応）
- 🤖 Claude AIによる勘定科目・税区分の自動推定
- ✅ 推定結果の確認・修正ワークフロー
- 📊 弥生会計・freee形式でのエクスポート
- 🔒 Row Level Securityによるデータ保護

## Tech Stack

| カテゴリ | 技術 |
|---------|------|
| Frontend/Backend | Next.js 16 (App Router) |
| Database/Auth | Supabase |
| AI | Claude API (Anthropic) |
| Testing | Vitest 4 + Playwright |
| Linter | Biome |
| CI/CD | GitHub Actions |

## セットアップ

```bash
# 1. クローン
git clone https://github.com/your-username/kanjou-ai.git && cd kanjou-ai

# 2. 依存関係インストール（最新版で固定）
npm install

# 3. 環境変数設定
cp .env.example .env.local

# 4. Supabase セットアップ
npx supabase start && npx supabase db reset

# 5. 開発サーバー起動
npm run dev
```

## Claude Code セットアップ

```bash
# Context7 MCP（最新ライブラリ版の取得）
claude mcp add context7 -- npx -y @upstash/context7-mcp

# 動作確認
claude mcp list
```

## プロジェクトルール

- **TDD必須**: テストを先に書いてから実装（Red-Green-Refactor）
- PR: 300行以下 / 10ファイル以下
- テストカバレッジ: 80%以上
- 全テーブル: RLS必須
- 全Server Actions: Zod + ApiResponse<T> + handleApiError()
- バージョン: Context7 MCP で最新版確認 → exact version固定

## Claude Code コマンド

```
/tdd               # TDD Red-Green-Refactor サイクル開始
/create-pr         # PR作成（300行チェック付き）
/security-scan     # セキュリティスキャン
/test-coverage     # カバレッジレポート
/db-migration      # DBマイグレーション生成
/review-checklist  # コードレビューチェック
```
