## Issue 実装コマンド

指定された GitHub Issue を実装してください。

### ⚠️ 最重要ルール

**Phase 3（自動品質サイクル）を完了するまで、Phase 4（PR 作成）に絶対に進まないこと。**
Phase 2 の全チェックが通っても、Phase 3 をスキップしてはならない。

### Phase 1: 計画

1. `gh issue view $ARGUMENTS` で Issue の内容を確認
2. CLAUDE.md の Critical Rules を全て確認
3. Plan mode で計画を立てて表示:
   - ファイル一覧と推定行数
   - 300行超なら分割案
   - TDDの各フェーズ（RED/GREEN/REFACTOR）でやること
4. 計画の承認を待ってから実装開始

### Phase 2: TDD 実装

5. 🔴 RED: テストを先に書く（Server Action + UIインタラクション両方）
6. テストが失敗することを確認
7. 🟢 GREEN: 最小限の実装でテストを通す
8. 🔵 REFACTOR: コード整理 + カバレッジ確認
9. 全チェック実行:
   - npm run typecheck
   - npm run lint
   - npm run test:unit
   - npm run build

### Phase 2.5: 実装コミット

10. 変更ファイルをステージング + コミット（`feat: <Issue要約> (#Issue番号)`）

**ここで /create-pr を呼ばない。次の Phase 3 に進むこと。**

### Phase 3: 自動品質サイクル（人間の介入不要・最大 3 回ループ）

ステップ 10 のコミット完了後、以下を自動で実行する。
人間に確認を求めず、自分で判断して進めること。

**ループ開始（ループ回数 = 0）:**

11. 「code-reviewer エージェントで直近のコミットの変更をレビューして」と指示してサブエージェントを起動する
12. レビュー結果を確認:
    - **「LGTM」と出力された** → Phase 4 へ進む
    - **指摘が出力された** → ステップ 13 へ
13. 指摘内容に基づいてコードを修正する
    - /fix-review は使わない（PR コメントベースのため自動ループに不適）
    - TDD の原則を守る（テストが壊れる修正はしない）
14. 修正後チェック:
    - npm run typecheck
    - npm run lint
    - npm run test:unit
15. `git diff --stat HEAD` で修正の変更量を確認:
    - **ファイル 5 以上 or 変更行 50 超**:
      a. `git checkout .` で Phase 3 の修正分のみ巻き戻し
      b. 以下を表示して停止（/create-pr は呼ばない）:
         ⚠️ 自動修正が閾値を超えました（ファイル: N, 行: N）。
         巻き戻し済みです。以下の指摘は手動で /fix-review を使って対応してください:
         （指摘リスト）
    - **閾値以内** → ループ回数 + 1 してステップ 11 に戻る
16. ループ回数が 3 に達した場合 → 以下を表示して停止（/create-pr は呼ばない）:
    ⚠️ 自動レビューサイクル上限（3回）に到達しました。
    残りの指摘は手動で /fix-review を使って対応してください:
    （指摘リスト）

### Phase 4: PR 作成（Phase 3 で LGTM を得た場合のみ到達可能）

17. `npm run build` で最終ビルド確認
18. `/create-pr` で PR を作成

### 注意事項
- 新規ライブラリは Context7 で最新版確認 (use context7)
- ページコンポーネントにユーザー操作がある場合、UIテストも必須（Rule 13）
- Server Action の呼び出し元で戻り値チェック + toast フィードバック必須
- main への直接プッシュ禁止（Rule 11）

$ARGUMENTS には Issue 番号が入ります。
