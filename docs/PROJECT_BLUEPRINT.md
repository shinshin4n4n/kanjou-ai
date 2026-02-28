# KanjouAI（勘定AI）プロジェクトブループリント v2

## 1. プロジェクト概要

| 項目 | 内容 |
|------|------|
| アプリ名 | KanjouAI（勘定AI） |
| コンセプト | フリーランスの確定申告仕訳をAIで一括処理 |
| ターゲット | フリーランス個人（海外送金利用者含む） |
| 技術スタック | Next.js 16 + Supabase + Claude API |
| ポートフォリオ価値 | 実体験 × AI × フルスタック × TDD |

## 2. TubeReviewからの教訓テンプレート

### 2.1 コードレビュー指摘 → 初日から対策

| # | TubeReview課題 | KanjouAI対策 |
|---|---------------|-------------|
| 1 | APIキー露出リスク | 環境変数の厳格管理 + gitleaks CI |
| 2 | RLS未設定テーブル | 全テーブルRLS必須、migration テンプレート化 |
| 3 | 入力検証不足 | Zod スキーマを全Server Action入口で適用 |
| 4 | CIパイプライン不備 | lint→typecheck→test→build→security 5段階 |
| 5 | カバレッジ不足 | 80%閾値をCI強制 |
| 6 | エラーハンドリング散在 | `ApiResponse<T>` + `handleApiError()` 統一 |
| 7 | PR巨大化 | 300行/10ファイル制限をCI + Plan mode見積もりで二重チェック |

### 2.2 TubeReviewで確立したパターン（継続採用）

- `ApiResponse<T>` 統一戻り値型
- `handleApiError()` 集中エラーハンドリング
- Server Actions 優先（API Routes は Webhook 等のみ）
- Supabase Auth + RLS セキュリティモデル
- Conventional Commits + Feature Branch フロー
- Plan mode での推定サイズ記載（300行超は分割計画必須）
- PR作成前の `git diff --stat` 実測チェック

## 3. バージョン選定方針

### 3.1 ルール

- 新規ライブラリ導入時は **必ず最新安定版を確認** してからインストール
- Claude Code使用時: Context7 skill または Web検索で最新版を取得
- `@latest` でのインストールを基本とし、インストール後にバージョンを固定
- `package.json` には **exact version**（`"next": "16.1.6"` 形式）で記録

### 3.2 初期バージョン（2026年2月時点の最新安定版）

| パッケージ | バージョン | 備考 |
|-----------|-----------|------|
| Next.js | 16.1.x | App Router, React 19.2同梱 |
| React | 19.2.x | Next.js 16同梱 |
| TypeScript | 5.x latest | strict mode |
| Tailwind CSS | 4.x | |
| Supabase JS | 2.x latest | @supabase/ssr 併用 |
| Zod | 4.x | v3ではなくv4 |
| Vitest | 4.x | カバレッジ: @vitest/coverage-v8 |
| Playwright | 1.58+ | E2E |
| Biome | 2.x latest | ESLint + Prettier 代替 |
| Anthropic SDK | latest | Claude API |

### 3.3 インストール手順テンプレート

```bash
# Step 1: Context7 or Web検索で最新安定版を確認
# Step 2: インストール
npm install package@latest
# Step 3: インストールされたバージョンを確認
cat package.json | grep "package"
# Step 4: exact versionであることを確認（^や~がないこと）
```

## 4. 主要機能（MVP）

1. **ユーザー認証**: メール/パスワード + Google OAuth
2. **取引データ入力**: 手動入力 / CSV一括アップロード
3. **CSV対応フォーマット**:
   - **Wise**: TransferWise ID, Date, Amount, Currency, Description, Payment Reference, Running Balance, Exchange From/To/Rate, Payer/Payee Name, Total fees
   - **Revolut**: Date, Description, Amount, Currency, Balance（CSV/PDF出力対応、UTC/ローカル時刻）
   - **汎用CSV**: 日付, 摘要, 金額（最低3列）
4. **AI仕訳推定**: Claude APIで勘定科目・税区分を自動判定
5. **仕訳一覧・編集**: 推定結果の確認・修正
6. **エクスポート**: 弥生・freee形式CSV出力

## 5. データベース設計

### 5.1 テーブル一覧

```sql
-- profiles: ユーザープロフィール
-- transactions: 取引データ（金額はINTEGER円単位）
-- import_logs: CSVインポート履歴
-- account_categories: 勘定科目マスタ（システムデフォルト + ユーザーカスタム）
-- csv_mappings: CSV形式マッピング設定（Wise/Revolut/カスタム）
```

### 5.2 全テーブル共通ルール

- RLS必須（migration時に必ず有効化）
- Soft Delete: `deleted_at IS NULL` パターン
- `updated_at` 自動更新トリガー
- user_id カラムにはインデックス必須

## 6. 開発マイルストーン

| Phase | 機能 | 期間目安 |
|-------|------|---------|
| 0 | プロジェクト基盤（テンプレート適用） | 1日 |
| 1 | 認証 + プロフィール | 2-3日 |
| 2 | 取引CRUD（手動入力） | 3-4日 |
| 3 | AI仕訳推定（Claude API連携） | 3-4日 |
| 4 | CSVインポート（Wise/Revolut/汎用） | 3-4日 |
| 5 | エクスポート（弥生/freee形式） | 2-3日 |
| 6 | ダッシュボード + UX改善 | 2-3日 |
