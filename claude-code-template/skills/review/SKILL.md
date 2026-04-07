---
name: review
description: PR をレビューする。CLAUDE.md の Critical Rules、セキュリティ、コード品質の観点でチェック。「PR をレビューして」「コードレビューして」等で自動起動。
---

## PR レビューコマンド

指定されたPRをレビューしてください。

### 手順

1. `gh pr diff $ARGUMENTS` で差分を取得
2. CLAUDE.md の Critical Rules に基づいてレビュー

### レビュー観点

#### Critical Rules（CLAUDE.md）
- [ ] TDD で実装されているか（テストが先に書かれているか）
- [ ] テストカバレッジは {{COVERAGE_THRESHOLD}}% 以上か
- [ ] `any` 型が使われていないか
- [ ] PRサイズは {{PR_MAX_LINES}}行以下 / {{PR_MAX_FILES}}ファイル以下か
- [ ] 新規ライブラリは Context7 で最新版確認されているか

#### セキュリティ
- [ ] 全入力がバリデーションされているか
- [ ] エラーレスポンスに機密情報（stack, details, email）が含まれていないか
- [ ] `console.log` が残っていないか
- [ ] 環境変数の使い分けは正しいか
- [ ] シークレットがハードコードされていないか
- [ ] `.env.example` が更新されているか（新規環境変数がある場合）

#### コード品質
- [ ] 関数・変数の命名は明確か
- [ ] 重複コードがないか
- [ ] コンポーネントの責務が明確か

3. 問題があれば `gh pr review $ARGUMENTS --request-changes -b "レビュー内容"` でコメント
4. 問題なければ `gh pr review $ARGUMENTS --approve -b "LGTM"` で承認

### 使い方
別ターミナルで Claude Code を起動して:
/review {PR番号}

$ARGUMENTS にはPR番号が入ります。
