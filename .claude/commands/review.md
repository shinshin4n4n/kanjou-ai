## PR レビューコマンド

指定されたPRをレビューしてください。

### 手順

1. `gh pr diff $ARGUMENTS` で差分を取得
2. CLAUDE.md の Critical Rules、.claude/task-checklists.md の全チェックリスト、.claude/security.md のルールに基づいてレビュー

### レビュー観点

#### Critical Rules（CLAUDE.md）
- [ ] Server Actions は ApiResponse<T> を返しているか
- [ ] 全エラーは handleApiError() で処理されているか
- [ ] TDD で実装されているか（テストが先に書かれているか）
- [ ] テストカバレッジは 80% 以上か
- [ ] any 型が使われていないか
- [ ] RLS が有効なテーブルに対するクエリか
- [ ] PRサイズは 300行以下 / 10ファイル以下か
- [ ] 新規ライブラリは Context7 で最新版確認されているか

#### セキュリティ（security.md + task-checklists.md）
- [ ] 全入力が Zod でバリデーションされているか
- [ ] エラーレスポンスに機密情報（stack, details, email）が含まれていないか
- [ ] console.log が残っていないか
- [ ] 環境変数の NEXT_PUBLIC_ の使い分けは正しいか
- [ ] シークレットがハードコードされていないか
- [ ] .env.example が更新されているか（新規環境変数がある場合）
- [ ] IDOR 脆弱性がないか（他ユーザーのデータにアクセスできないか）
- [ ] Soft Delete を考慮しているか（deleted_at IS NULL）

#### データベース（architecture.md）
- [ ] 金額は INTEGER（円単位、小数なし）か
- [ ] RLS ポリシーでユーザーは自分のデータのみアクセス可能か
- [ ] マイグレーションがある場合、.env.example も更新されているか

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
