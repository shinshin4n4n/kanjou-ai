## PR 自動マージコマンド

指定された PR をスカッシュマージ（auto）で設定してください。

### 手順

1. `gh pr merge $ARGUMENTS --squash --delete-branch --auto` を実行
2. 結果を表示:
   - 成功 → 「PR #$ARGUMENTS の自動マージを設定しました。CI 通過後にマージされます。」
   - 失敗 → エラー内容を表示

### ルール
- マージ方式は **スカッシュマージ固定**（Squash and merge）
- マージ後のブランチは自動削除（`--delete-branch`）
- CI 通過後に自動マージ（`--auto`）

$ARGUMENTS には PR 番号が入ります。
