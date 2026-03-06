## Issue 実装コマンド

指定された GitHub Issue を実装してください。

### 手順

1. `gh issue view $ARGUMENTS` で Issue の内容を確認
2. CLAUDE.md の Critical Rules を全て確認
3. Plan mode で計画を立てて表示:
   - ファイル一覧と推定行数
   - 300行超なら分割案
   - TDDの各フェーズ（RED/GREEN/REFACTOR）でやること
4. 計画の承認を待ってから実装開始
5. 🔴 RED: テストを先に書く（Server Action + UIインタラクション両方）
6. テストが失敗することを確認
7. 🟢 GREEN: 最小限の実装でテストを通す
8. 🔵 REFACTOR: コード整理 + カバレッジ確認
9. 全チェック実行:
   - npm run typecheck
   - npm run lint
   - npm run test:unit
   - npm run build
10. `/create-pr` で PR を作成

### 注意事項
- 新規ライブラリは Context7 で最新版確認 (use context7)
- ページコンポーネントにユーザー操作がある場合、UIテストも必須（Rule 13）
- Server Action の呼び出し元で戻り値チェック + toast フィードバック必須
- main への直接プッシュ禁止（Rule 11）

$ARGUMENTS には Issue 番号が入ります。
