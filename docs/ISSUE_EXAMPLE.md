# Issue テンプレート記入例（Issue #5: 共通ライブラリ基盤）

以下は Issue テンプレートを実際に記入した例です。
Claude Code に作業を依頼する際の参考にしてください。

---

## feat: ApiResponse<T> + handleApiError + 定数 + バリデーション

### 概要

Server Actions の統一的なエラーハンドリング基盤と、
アプリ全体で使用する定数・バリデーションスキーマを実装する。

### 背景・目的

TubeReview の評価で Security Awareness（85点）と Technical Quality（78点）の
改善が指摘された。エラーハンドリングの一元化により、
ZodError の詳細漏洩やスタックトレース露出を防ぐ。

### 実装方針

- `ApiResponse<T>` 型で全 Server Actions の戻り値を統一
- `handleApiError()` で ZodError / Supabase エラー / 未知のエラーを安全に変換
- Zod 4 でトランザクション系バリデーションスキーマを定義

### タスク（TDD Red-Green-Refactor）

- [ ] 🔴 handleApiError のテスト（7ケース: ZodError漏洩防止、RLS違反変換、重複エラー、不明エラー等）
- [ ] 🔴 テスト失敗を確認
- [ ] 🟢 lib/api/error.ts 実装
- [ ] 🟢 テスト成功を確認
- [ ] 🔴 Zodバリデーションスキーマのテスト（正常系3 + 異常系4）
- [ ] 🟢 lib/validators/transaction.ts 実装
- [ ] lib/types/api.ts（ApiResponse<T>）
- [ ] lib/utils/constants.ts（勘定科目21種、税区分5種）
- [ ] next.config.ts（セキュリティヘッダー7種 + removeConsole）
- [ ] 🔵 リファクタ + カバレッジ確認

### 受け入れ条件（数値基準）

| 指標 | 基準値 |
|------|--------|
| テストカバレッジ（error.ts） | ≥ 90% |
| テストカバレッジ（transaction.ts） | ≥ 85% |
| テストケース数 | ≥ 14（handleApiError 7 + validation 7） |
| TypeScript 型エラー | 0件 |
| Lint エラー | 0件 |
| ビルド | 成功 |
| PR サイズ | ≤ 300行 / ≤ 10ファイル |

#### 機能要件

- [ ] `handleApiError()` が ZodError の詳細を外部に漏らさない
- [ ] `handleApiError()` が Supabase RLS 違反を安全なメッセージに変換する
- [ ] `handleApiError()` が未知のエラーを「予期しないエラーが発生しました」に変換する
- [ ] 勘定科目マスタが21種類定義されている
- [ ] セキュリティヘッダーが7種設定されている

#### 非機能要件

- [ ] エラーレスポンスに `stack`, `details`, `email` を含まない
- [ ] 本番環境で `console.log` が自動削除される

### テスト観点

- [ ] 正常系: ApiResponse<T> の success: true パターン
- [ ] 異常系: ZodError → バリデーションエラーメッセージ（詳細なし）
- [ ] 異常系: Supabase 23505 → 重複エラーメッセージ
- [ ] 異常系: Supabase 42501 → 権限エラーメッセージ
- [ ] 異常系: 未知のエラー → 汎用エラーメッセージ
- [ ] エッジケース: null / undefined 入力

### 推定サイズ

- 推定変更行数: 280行
- 推定変更ファイル数: 8ファイル

### 関連

- 依存: Issue #1（プロジェクト初期化）
- 参照: CLAUDE.md の Critical Rules #1, #2
