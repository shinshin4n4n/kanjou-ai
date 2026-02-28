# KanjouAI 実装計画

## 全体タイムライン

```
Phase 0: プロジェクト基盤              [1日]
Phase 1: 認証 + プロフィール            [2-3日]
  ── デザイン設計セッション（v0.dev） ──  [半日〜1日]
  ── UI共通コンポーネント取り込み ──      [半日]
Phase 2: 取引CRUD（手動入力）           [3-4日]
Phase 3: AI仕訳推定                    [3-4日]
Phase 4: CSVインポート                 [3-4日]
Phase 5: エクスポート                  [2-3日]
Phase 6: ダッシュボード + 公開準備       [2-3日]
```

## 開発ツール連携

| ツール | セットアップタイミング | 用途 |
|--------|---------------------|------|
| **Context7 MCP** | Phase 0 Issue #1 | 最新ライブラリ版の取得 |
| **Vercel** | Phase 0 Issue #2 | PRごとのプレビューURL自動生成 |
| **Claude Code /tdd** | Phase 0 Issue #3 | TDD Red-Green-Refactor 強制 |
| **v0.dev** | Phase 1完了後 | UIプロトタイプ生成（PR不要） |
| **frontend-design skill** | Phase 2以降 | コンポーネント微調整 |

---

## Phase 0: プロジェクト基盤 [1日]

### Issue #1: プロジェクト初期化
```
feat: プロジェクト初期化（Next.js + Supabase + CI/CD）

## タスク
- [ ] Context7 MCP セットアップ: `claude mcp add context7 -- npx -y @upstash/context7-mcp`
- [ ] Context7 で Next.js / Supabase / Zod 最新版を確認
- [ ] `npx create-next-app@latest` で作成
- [ ] 依存パッケージインストール（Zod, Supabase, Anthropic SDK等）
- [ ] 全パッケージを exact version で固定
- [ ] Biome 設定
- [ ] TypeScript strict mode 確認
- [ ] Vitest + Playwright 設定（80%閾値）
- [ ] .env.example 作成

## 推定サイズ
- 推定変更行数: 200行（設定ファイル中心）
- 推定変更ファイル数: 8ファイル
```

### Issue #2: CI/CD + Vercel セットアップ
```
chore: CI/CD パイプライン + Vercel 連携

## タスク
- [ ] GitHub リポジトリ作成
- [ ] ci.yml（lint→typecheck→test→build→security 5段階）
- [ ] pr-size-check.yml（300行/10ファイル制限）
- [ ] Vercel プロジェクト作成 + GitHub連携
- [ ] プレビューデプロイ動作確認
- [ ] gitleaks + NEXT_PUBLIC_チェック

## 推定サイズ
- 推定変更行数: 150行
- 推定変更ファイル数: 5ファイル
```

### Issue #3: Claude Code 環境設定
```
docs: CLAUDE.md + カスタムコマンド + タスクチェックリスト

## タスク
- [ ] CLAUDE.md 配置
- [ ] .claude/task-checklists.md 配置
- [ ] .claude/commands/tdd.md 配置（TDD Red-Green-Refactor サイクル）
- [ ] .claude/commands/create-pr.md 配置（PR作成 + 300行チェック）
- [ ] .claude/settings.json 配置
- [ ] GitHub Issue テンプレート + PR テンプレート
- [ ] README.md

## 推定サイズ
- 推定変更行数: 300行（ドキュメントのみ → 500行まで許容）
- 推定変更ファイル数: 10ファイル
```

### Issue #4: DB初期スキーマ + シードデータ
```
feat: Supabase 初期スキーマ（profiles, transactions, account_categories, import_logs, csv_mappings）

## タスク
- [ ] supabase init（ローカル環境）
- [ ] 00001_initial_schema.sql（5テーブル + RLS + インデックス + トリガー）
- [ ] seed.sql（デフォルト勘定科目マスタ）
- [ ] ローカルで supabase db reset 動作確認
- [ ] 型生成: supabase gen types typescript

## 推定サイズ
- 推定変更行数: 250行
- 推定変更ファイル数: 4ファイル
```

### Issue #5: 共通ライブラリ基盤
```
feat: ApiResponse<T> + handleApiError + 定数 + バリデーション

## タスク（TDDで実装）
- [ ] 🔴 handleApiError のテストを先に書く
- [ ] 🟢 lib/api/error.ts 実装（handleApiError + ApiError + エラーコード）
- [ ] 🔴 バリデーションのテストを先に書く
- [ ] 🟢 lib/validators/transaction.ts 実装（Zodスキーマ）
- [ ] lib/types/api.ts（ApiResponse<T>）
- [ ] lib/utils/constants.ts（勘定科目, 税区分, 定数）
- [ ] next.config.ts（セキュリティヘッダー + removeConsole）
- [ ] 🔵 リファクタ + カバレッジ確認

## 推定サイズ
- 推定変更行数: 280行
- 推定変更ファイル数: 8ファイル
```

---

## Phase 1: 認証 + プロフィール [2-3日]

### Issue #6: Supabase Auth セットアップ
```
feat: 認証基盤（Supabase Auth + ミドルウェア）

## タスク（TDDで実装）
- [ ] 🔴 requireAuth / getUser のテストを先に書く
- [ ] 🟢 lib/auth.ts 実装
- [ ] lib/supabase/client.ts（ブラウザ用）
- [ ] lib/supabase/server.ts（サーバー用）
- [ ] lib/supabase/middleware.ts（セッション管理）
- [ ] middleware.ts（認証ルーティング）
- [ ] 🔵 リファクタ + カバレッジ確認

## 推定サイズ
- 推定変更行数: 200行
- 推定変更ファイル数: 6ファイル
```

### Issue #7: ログイン / サインアップ UI
```
feat: 認証画面（メール/パスワード + Google OAuth）

## タスク
- [ ] app/(auth)/login/page.tsx
- [ ] app/(auth)/signup/page.tsx
- [ ] app/(auth)/callback/route.ts（OAuth コールバック）
- [ ] コンポーネント: AuthForm
- [ ] E2Eテスト: ログインフロー

## 推定サイズ
- 推定変更行数: 250行
- 推定変更ファイル数: 6ファイル
```

### Issue #8: プロフィール設定
```
feat: プロフィール設定画面（会計年度開始月、デフォルト税区分）

## タスク（TDDで実装）
- [ ] 🔴 updateProfile Server Action のテストを先に書く
- [ ] 🟢 app/_actions/profile-actions.ts 実装
- [ ] app/settings/page.tsx
- [ ] Zodバリデーション + エラー表示
- [ ] 🔵 リファクタ + カバレッジ確認

## 推定サイズ
- 推定変更行数: 200行
- 推定変更ファイル数: 5ファイル
```

### Phase 1 完了時の追加タスク

Phase 1 の実装コードが揃った段階で、以下のドキュメントを実コードに基づいて作成する:

- `.claude/architecture.md` — Data Flow、File Structure、Server Action/DB/Clientのパターン集
- `.claude/security.md` — 脆弱性パターン（IDOR, Mass Assignment等）、モック例
- `.claude/testing.md` — TDDワークフロー詳細、モックパターン集、テストコード例

※実装前に書くと実態と乖離するため、Phase 1 完了後に実コードをベースに作成する。

---

## 🎨 デザイン設計セッション [半日〜1日]

**タイミング: Phase 1 完了後、Phase 2 開始前**

認証が動くVercelプレビューがある状態で、UIを固める。
**PRは出さず、v0.dev上で反復してからまとめてコードに取り込む。**

### Step 1: 参考UI収集（PR不要）

```
- freee / Money Forward / Wave / FreshBooks 等の画面を参考に
- 「このレイアウトが好き」「テーブルはこの見せ方」を部分的にピックアップ
- スクリーンショットを v0.dev に渡す素材として準備
```

### Step 2: v0.dev でプロトタイプ生成（PR不要）

```
- v0.dev (https://v0.dev) にアクセス
- 参考UIを添付 +「確定申告の取引一覧画面、Tailwind CSS、日本語」等と指示
- ブラウザ上で何度でも調整（この段階ではPR不要）
- 主要5画面のプロトタイプを生成:
  1. ダッシュボード
  2. 取引一覧
  3. 取引入力/編集
  4. CSVインポート
  5. エクスポート
```

### Step 3: デザイン確定 → ドキュメント化

```
## 決めること
1. レイアウト構成（サイドバー or ヘッダーナビ）
2. 主要5画面のレイアウト（v0.devで確認済み）
3. 共通コンポーネント一覧（Button, Table, Form, Card, Badge 等）
4. カラースキーム + フォント
5. レスポンシブ方針（モバイルファースト）

## 成果物
- docs/UI_DESIGN.md（コンポーネント設計 + スタイルガイド）
```

### Step 4: コードに一括取り込み → PR

```
Issue #8.5: UI共通コンポーネント取り込み

## タスク
- [ ] v0.dev で確定したコンポーネントをプロジェクトにコピー
- [ ] Tailwind テーマ設定（カラー、フォント）
- [ ] 共通レイアウト（Sidebar or Header + Main）
- [ ] 共通コンポーネント（Button, Input, Table, Card, Badge, Modal）
- [ ] Storybook的な確認（Vercelプレビューで実機確認）

## 推定サイズ
- 推定変更行数: 300行
- 推定変更ファイル数: 8ファイル

## 備考
- Claude Code 使用時は frontend-design skill が自動適用される
- v0.dev で生成した基盤の上に、Claude Code で微調整・追加を行う
```

---

## Phase 2: 取引CRUD [3-4日]

### Issue #9: 取引一覧画面
```
feat: 取引一覧（フィルタ + ソート + ページネーション）

## タスク（TDDで実装）
- [ ] 🔴 getTransactions Server Action のテストを先に書く
- [ ] 🟢 app/_actions/transaction-actions.ts（getTransactions）実装
- [ ] app/transactions/page.tsx（Server Component）
- [ ] コンポーネント: TransactionList, TransactionRow
- [ ] フィルタ: 日付範囲、確認済み/未確認、勘定科目
- [ ] E2Eテスト
- [ ] 🔵 リファクタ + カバレッジ確認

## 推定サイズ
- 推定変更行数: 280行
- 推定変更ファイル数: 7ファイル
```

### Issue #10: 取引作成/編集
```
feat: 取引の作成・編集フォーム

## タスク（TDDで実装）
- [ ] 🔴 createTransaction / updateTransaction のテストを先に書く
- [ ] 🟢 app/_actions/transaction-actions.ts 実装
- [ ] app/transactions/new/page.tsx
- [ ] app/transactions/[id]/page.tsx
- [ ] コンポーネント: TransactionForm
- [ ] 勘定科目セレクター（検索可能）
- [ ] Zodバリデーション + エラー表示
- [ ] 🔵 リファクタ + カバレッジ確認

## 推定サイズ
- 推定変更行数: 280行
- 推定変更ファイル数: 6ファイル
```

### Issue #11: 取引削除 + 確認フラグ
```
feat: 取引の論理削除 + AI推定の確認/修正フロー

## タスク（TDDで実装）
- [ ] 🔴 deleteTransaction / confirmTransaction のテストを先に書く
- [ ] 🟢 実装（soft delete + isConfirmed フラグ更新）
- [ ] 一括確認機能
- [ ] 🔵 リファクタ + カバレッジ確認

## 推定サイズ
- 推定変更行数: 180行
- 推定変更ファイル数: 4ファイル
```

---

## Phase 3: AI仕訳推定 [3-4日]

### Issue #12: Claude API クライアント
```
feat: Claude API 連携（仕訳推定ロジック）

## タスク（TDDで実装）
- [ ] 🔴 classifyTransactions のテストを先に書く（モックAPI使用）
- [ ] 🟢 lib/claude/client.ts 実装（API呼び出し + レスポンスパース）
- [ ] lib/claude/prompts.ts（システムプロンプト + ユーザープロンプト生成）
- [ ] lib/claude/types.ts（AI応答型定義）
- [ ] レート制限チェック
- [ ] 🔵 リファクタ + カバレッジ確認

## 推定サイズ
- 推定変更行数: 250行
- 推定変更ファイル数: 5ファイル
```

### Issue #13: AI仕訳推定 Server Action + UI
```
feat: AI仕訳推定の実行 + 結果表示UI

## タスク（TDDで実装）
- [ ] 🔴 classifyTransactions Server Action のテストを先に書く
- [ ] 🟢 app/_actions/ai-classify-actions.ts 実装
- [ ] 確信度表示（HIGH/MEDIUM/LOW のバッジ）
- [ ] 推定結果の一括承認/個別修正UI
- [ ] 統合テスト
- [ ] 🔵 リファクタ + カバレッジ確認

## 推定サイズ
- 推定変更行数: 280行
- 推定変更ファイル数: 6ファイル
```

---

## Phase 4: CSVインポート [3-4日]

### Issue #14: CSVパーサー（Wise / Revolut / 汎用）
```
feat: CSVパーサー + フォーマット自動判定

## タスク（TDDで実装）
- [ ] 🔴 detectCsvFormat / normalizeDate / parseAmount のテストを先に書く
- [ ] 🟢 lib/csv/parsers.ts 実装（ヘッダー判定、日付正規化、金額パース）
- [ ] Wise 19カラムパーサー
- [ ] Revolut 5カラムパーサー
- [ ] 汎用CSVパーサー
- [ ] 🔵 リファクタ + カバレッジ確認

## 推定サイズ
- 推定変更行数: 250行
- 推定変更ファイル数: 4ファイル
```

### Issue #15: CSVインポート UI + Server Action
```
feat: CSVアップロード → プレビュー → インポート実行

## タスク（TDDで実装）
- [ ] 🔴 importTransactions Server Action のテストを先に書く
- [ ] 🟢 app/_actions/import-actions.ts 実装
- [ ] app/import/page.tsx
- [ ] ファイルアップロード（型・サイズ制限）
- [ ] プレビュー表示（パース結果確認）
- [ ] インポート実行 + import_logs 記録
- [ ] AI仕訳推定の自動実行オプション
- [ ] 🔵 リファクタ + カバレッジ確認

## 推定サイズ
- 推定変更行数: 280行
- 推定変更ファイル数: 6ファイル
```

---

## Phase 5: エクスポート [2-3日]

### Issue #16: 弥生 / freee / 汎用 CSV エクスポート
```
feat: 仕訳データのCSVエクスポート（弥生・freee・汎用形式）

## タスク（TDDで実装）
- [ ] 🔴 各フォーマッターのテストを先に書く
- [ ] 🟢 lib/export/formatters.ts 実装（弥生・freee・汎用）
- [ ] app/export/page.tsx（期間選択 + 形式選択 + ダウンロード）
- [ ] app/_actions/export-actions.ts
- [ ] 確認済みデータのみエクスポートオプション
- [ ] 🔵 リファクタ + カバレッジ確認

## 推定サイズ
- 推定変更行数: 250行
- 推定変更ファイル数: 5ファイル
```

---

## Phase 6: ダッシュボード + 公開準備 [2-3日]

### Issue #17: ダッシュボード
```
feat: ダッシュボード（月次サマリー + 勘定科目別集計）

## タスク
- [ ] app/dashboard/page.tsx
- [ ] 月次収支サマリー
- [ ] 勘定科目別の経費内訳
- [ ] 未確認仕訳の件数表示
- [ ] 直近のインポート履歴

## 推定サイズ
- 推定変更行数: 250行
- 推定変更ファイル数: 5ファイル
```

### Issue #18: 公開準備 + ドキュメント整備
```
docs: README強化 + セキュリティ方針 + ポートフォリオ用ドキュメント

## タスク
- [ ] README.md 充実化（デモURL、スクリーンショット、技術選定理由）
- [ ] SECURITY.md（セキュリティ方針の明文化）
- [ ] 技術選定理由ドキュメント（TubeReviewとの対比含む）
- [ ] Supabase本番プロジェクト設定
- [ ] 環境変数の本番設定
- [ ] OGP + メタデータ

## 推定サイズ
- 推定変更行数: 300行（ドキュメント中心）
- 推定変更ファイル数: 6ファイル
```

---

## 全Issue サマリー

| # | Phase | タイトル | 推定行数 | TDD | ツール |
|---|-------|---------|---------|-----|--------|
| 1 | 0 | プロジェクト初期化 | 200行 | - | Context7 MCP |
| 2 | 0 | CI/CD + Vercel | 150行 | - | - |
| 3 | 0 | Claude Code 環境設定 | 300行 | - | - |
| 4 | 0 | DB初期スキーマ | 250行 | - | - |
| 5 | 0 | 共通ライブラリ基盤 | 280行 | ✅ | /tdd |
| 6 | 1 | Supabase Auth セットアップ | 200行 | ✅ | /tdd |
| 7 | 1 | ログイン/サインアップ UI | 250行 | - | - |
| 8 | 1 | プロフィール設定 | 200行 | ✅ | /tdd |
| 🎨 | - | デザイン設計（v0.dev） | - | - | v0.dev |
| 8.5 | - | UI共通コンポーネント取り込み | 300行 | - | frontend-design skill |
| 9 | 2 | 取引一覧画面 | 280行 | ✅ | /tdd |
| 10 | 2 | 取引作成/編集 | 280行 | ✅ | /tdd |
| 11 | 2 | 取引削除 + 確認フラグ | 180行 | ✅ | /tdd |
| 12 | 3 | Claude API クライアント | 250行 | ✅ | /tdd |
| 13 | 3 | AI仕訳推定 UI | 280行 | ✅ | /tdd |
| 14 | 4 | CSVパーサー | 250行 | ✅ | /tdd |
| 15 | 4 | CSVインポート UI | 280行 | ✅ | /tdd |
| 16 | 5 | エクスポート | 250行 | ✅ | /tdd |
| 17 | 6 | ダッシュボード | 250行 | - | frontend-design skill |
| 18 | 6 | 公開準備 | 300行 | - | - |

**合計: 19 Issue / 約 4,730行 / 約 18-22日**

### 開発で使用するAIツール一覧

| ツール | 用途 | タイミング |
|--------|------|-----------|
| **Context7 MCP** | 最新ライブラリ版の取得・ドキュメント参照 | 新規パッケージ導入時 |
| **Claude Code /tdd** | TDD Red-Green-Refactor サイクル強制 | ロジック実装時（全Phase） |
| **v0.dev** | UIプロトタイプ生成・プレビュー | デザイン設計セッション |
| **frontend-design skill** | コンポーネント微調整・追加 | UI取り込み後の調整 |
| **Vercel Preview** | PRごとの実機確認 | 全PR |

全Issueが300行以下に収まっています。

---

## ブランチ保護ルール 段階的有効化

| Phase | 必須CIジョブ | 追加タイミング |
|-------|-------------|---------------|
| Phase 0（現在） | Lint, TypeScript, Build | 初期設定時 |
| Phase 0 Issue #5 完了後 | + Test (Coverage ≥ 80%) | テスト基盤が整った時点 |
| Phase 6 完了後 | + Security Scan | 公開準備時 |

ルールの更新コマンド（Issue #5 完了後に実行）:
`gh api repos/shinshin4n4n/kanjou-ai/rulesets/{ruleset_id} --method PUT` で `required_status_checks` に Test と Security を追加
