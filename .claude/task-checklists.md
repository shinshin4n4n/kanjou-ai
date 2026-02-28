# Task Checklists

タスク別のチェックリストです。作業前に該当するチェックリストを確認してください。

## 🆕 Adding New Feature

### Before Starting

- [ ] Issue を確認し、要件を理解する
- [ ] 既存の類似機能を確認
- [ ] `.claude/architecture.md` でアーキテクチャパターンを確認
- [ ] 技術スタックを確認（新しいライブラリが必要か？→ Context7 MCP で最新版確認）
- [ ] **Plan mode で推定サイズを記載**（300行超は分割計画必須）
- [ ] ブランチ作成: `git checkout -b feature/feature-name`

### During Development（TDD Red-Green-Refactor）

**🔴 RED: 失敗するテストを先に書く**
- [ ] テストファイル作成: `__tests__/{filename}.test.ts`
- [ ] 正常系 + 異常系 + エッジケースのテストを記述
- [ ] `npm run test:unit -- {テストファイル}` で失敗を確認
- [ ] ⚠️ テストが失敗するまで実装に進まない

**🟢 GREEN: テストを通す最小限の実装**
- [ ] Server Actions は `ApiResponse<T>` を返す
- [ ] エラーは `handleApiError()` で処理
- [ ] 入力は Zod でバリデーション
- [ ] 認証が必要な場合は `requireAuth()` を使用
- [ ] RLS ポリシーを確認
- [ ] `npm run test:unit -- {テストファイル}` で成功を確認
- [ ] ⚠️ テストに書いていない機能を追加しない

**🔵 REFACTOR: テストを維持しながら改善**
- [ ] コードの重複を除去
- [ ] 命名を改善、関数の分割・整理
- [ ] TypeScript strict mode に準拠、`any` 型を使用しない
- [ ] データ更新後は `revalidatePath()` を呼ぶ
- [ ] `npm run test:unit` で全テスト通過を確認

### Before Committing

- [ ] `npm run lint` が通過
- [ ] `npm run build` が成功
- [ ] `console.log` を削除
- [ ] 個人情報をログに出力していないか確認
- [ ] Conventional Commits 形式でコミット

## 📏 PR Scoping Guidelines

### サイズ上限

- **推奨**: 300行以下 / 10ファイル以下
- **ドキュメント・テストのみ**: 500行まで許容
- **300行超**: PR description に理由を明記

### 大規模変更の分割戦略

1. **Phase分割**: Phase 1 (型定義) → Phase 2 (実装) → Phase 3 (テスト)
2. **スコープ分割**: ディレクトリ単位やドメイン単位で分離
3. **Feature Flag**: 未完成機能はフラグで隠す

### 🚨 チェックポイント1: Plan mode（見積もり段階）

```markdown
## 推定サイズ
- 推定変更行数: XXX行
- 推定変更ファイル数: XX ファイル
- 300行超の場合の分割計画: （該当する場合のみ）
```

**判定基準**:
- 推定300行以下 → そのまま続行
- 推定300行超 → 分割計画を記載
- 分割不可能な場合 → 理由を明記し、ユーザーの承認を得る

### 🚨 チェックポイント2: PR作成前（実測段階）

```bash
# Step 1: サイズを実測
git diff --stat main...HEAD | tail -1

# Step 2: 結果を確認
# 例: "7 files changed, 250 insertions(+), 30 deletions(-)" → OK
# 例: "12 files changed, 420 insertions(+), 50 deletions(-)" → NG
```

**判定基準**:
- 300行以下 & 10ファイル以下 → PR作成を続行
- ドキュメント・テストのみ → 500行まで許容
- **上記以外** → PR作成を**中断**し、分割案を提示

## 📝 Creating PR

### Before Creating PR

- [ ] 全てのテストがパス
- [ ] Lint エラーがない
- [ ] ビルドが成功
- [ ] 自分のコードをレビュー
- [ ] **`git diff --stat main...HEAD | tail -1` でサイズを実測**
- [ ] **300行以下 & 10ファイル以下であることを確認**

### PR Description

- [ ] 何を変更したか明確に記載
- [ ] なぜ変更したか説明
- [ ] 関連 Issue をリンク
- [ ] 300行超の場合は分割しない理由を記載

## 🧪 Writing Tests（TDD）

### テスト作成手順

- [ ] **テストを実装より先に書く**（Red-Green-Refactor）
- [ ] テストファイル作成: `__tests__/{filename}.test.ts`
- [ ] AAA パターン（Arrange-Act-Assert）に従う
- [ ] 正常系 + 異常系 + エッジケース
- [ ] テストが失敗することを確認してから実装に進む

### Test Coverage

- [ ] Statements: 80%以上
- [ ] Branches: 75%以上
- [ ] Functions: 80%以上
- [ ] Lines: 80%以上

## 🔒 Security Review

### Input Validation

- [ ] 全ての入力を Zod でバリデーション
- [ ] XSS 対策（React の自動エスケープ）
- [ ] SQL インジェクション対策（Supabase のパラメータ化）

### Error Handling

- [ ] エラーレスポンスに機密情報を含めない
- [ ] スタックトレースを露出しない
- [ ] `handleApiError()` を使用

### Database Operations

- [ ] RLS ポリシーが有効
- [ ] ユーザーは自分のデータのみアクセス可能
- [ ] Soft Delete パターン使用
- [ ] IDOR 脆弱性の確認

### Environment Variables

- [ ] Public 変数は `NEXT_PUBLIC_` プレフィックス
- [ ] Private 変数はサーバー側のみで使用
- [ ] `.env.example` を更新
- [ ] シークレットをハードコードしない

## 🗄️ Database Changes

### Before Schema Changes

- [ ] 既存のスキーマを確認
- [ ] RLS ポリシーへの影響を確認
- [ ] マイグレーション戦略を計画

### Creating Migration

- [ ] マイグレーションファイル作成
- [ ] RLS有効化 + ポリシー設定を含む
- [ ] インデックスを含む
- [ ] ローカルでテスト

## 🐛 Bug Fixing

### Investigation

- [ ] 問題を再現
- [ ] 根本原因を特定
- [ ] 影響範囲を確認

### Fix

- [ ] 最小限の変更で修正
- [ ] テストを追加（リグレッション防止）
- [ ] コミットメッセージに Issue 番号を記載

## 🎯 Definition of Done

- [ ] 要件を満たしている
- [ ] **TDD で実装されている（テスト → 実装 → リファクタ の順序）**
- [ ] 全てのテストがパス（Unit + E2E）
- [ ] カバレッジ 80%以上
- [ ] Lint エラーなし
- [ ] TypeScript 型チェック通過
- [ ] PR がマージ済み

---

**Last Updated:** 2026-02-28
**Next Review:** 2026-05-28
