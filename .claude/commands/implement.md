## Issue 実装コマンド

指定された GitHub Issue を実装してください。

### 手順

#### Phase 1: 計画

1. `gh issue view $ARGUMENTS` で Issue の内容を確認
2. CLAUDE.md の Critical Rules を全て確認
3. Plan mode で計画を立てて表示:
   - ファイル一覧と推定行数
   - 300行超なら分割案
   - TDDの各フェーズ（RED/GREEN/REFACTOR）でやること
4. 計画の承認を待ってから実装開始

#### Phase 2: TDD 実装

5. 🔴 RED: テストを先に書く（Server Action + UIインタラクション両方）
6. テストが失敗することを確認
7. 🟢 GREEN: 最小限の実装でテストを通す
8. 🔵 REFACTOR: コード整理 + カバレッジ確認
9. 全チェック実行:
   - npm run typecheck
   - npm run lint
   - npm run test:unit
   - npm run build

#### Phase 3: 自動品質サイクル（最大 3 回）

ステップ 9 通過後、以下のサイクルを自動で回す。人間の介入は不要。

10. code-reviewer サブエージェント（Agent ツール、subagent_type: code-reviewer）を起動し、変更ファイルをレビュー
11. レビュー結果を判定:
    - **LGTM** → ステップ 16 へ進む
    - **指摘あり** → ステップ 12 へ
12. 指摘内容に基づきコードを直接修正する
    - TDD の原則を守る（テストが壊れる修正はしない）
    - `/fix-review` は使わない（PR コメントベースのため自動ループに不適）
13. 修正後チェック実行:
    - `npm run typecheck`
    - `npm run lint`
    - `npm run test:unit`
14. `git diff --stat` で変更量を確認:
    - **ファイル 5 以上 or 変更行 50 超** → `git checkout .` で修正を巻き戻し、以下を表示して **停止**:
      ```
      ⚠️ 自動修正が閾値を超えました。手動で対応してください。
      - 変更ファイル数: N
      - 変更行数: N
      - 未解消の指摘: （指摘サマリー）
      ```
    - **閾値以内** → ステップ 10 に戻る（次のループ）
15. 3 回ループしても指摘が残る場合 → 残りの指摘サマリーを提示して **停止**:
    ```
    ⚠️ 自動レビューサイクル上限（3 回）に到達しました。
    残りの指摘:
    - （指摘リスト）
    手動で対応してください。
    ```

#### Phase 4: PR 作成

16. `/create-pr` で PR を作成

### 注意事項
- 新規ライブラリは Context7 で最新版確認 (use context7)
- ページコンポーネントにユーザー操作がある場合、UIテストも必須（Rule 13）
- Server Action の呼び出し元で戻り値チェック + toast フィードバック必須
- main への直接プッシュ禁止（Rule 11）

$ARGUMENTS には Issue 番号が入ります。
