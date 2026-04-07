## レビュー指摘修正コマンド

指定された PR のレビュー指摘を修正してください。

### 手順

1. `gh pr view $ARGUMENTS --comments` でレビューコメントを取得
2. 指摘事項を優先度別に分類（🔴 Must Fix / 🟡 Should Fix / 🟢 Nice to have）
3. 全ての 🔴 と 🟡 を修正
4. 🟢 は可能な範囲で対応
5. 修正後に全チェック実行:
   - {{TYPECHECK_COMMAND}}
   - {{LINT_COMMAND}}
   - {{TEST_UNIT_COMMAND}}
6. コミット + プッシュ
   - コミットメッセージ: fix: PR #$ARGUMENTS レビュー指摘対応

### 注意事項
- 指摘にテスト追加が含まれる場合、適切なテストを検討
- スコープ外の変更が混入している場合は revert して別PRにする
- 修正で新たに{{PR_MAX_LINES}}行を超える場合は分割を検討
- 修正後のテストカバレッジが{{COVERAGE_THRESHOLD}}%を下回らないことを確認
- 修正完了後、修正内容のサマリーを表示すること

$ARGUMENTS には PR 番号が入ります。
