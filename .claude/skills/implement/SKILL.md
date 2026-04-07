---
name: implement
description: GitHub Issue を TDD で実装し、PR 作成・自動レビューサイクルまで完了する。「Issue を実装して」「#123 を実装して」「この機能を作って」等で自動起動。
---

## Issue 実装コマンド

指定された GitHub Issue を実装してください。

### ⚠️ 最重要ルール

**Phase 4（自動品質サイクル）を完了するまで、このコマンドは終了しない。**
Phase 3 で PR を作成した後、必ず Phase 4 に進むこと。

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

### Phase 2.5: E2Eテスト整合性チェック

UIに影響する変更（page.tsx、コンポーネント、勘定科目マスタ、ルーティング等）がある場合:

1. 変更したファイルに関連するE2Eテストを Grep ツールで特定（tests/e2e/ 配下を検索）
2. 該当するE2Eテストの内容を確認し、変更と整合しているか検証
3. 整合しない場合はE2Eテストを更新
4. ローカルでE2Eテスト実行（npm run dev が起動中の場合）:
   npx playwright test tests/e2e/該当ファイル.spec.ts --project=chromium
5. 失敗する場合は修正してから Phase 3 に進む

### Phase 3: PR 作成

10. create-pr Skill の手順に従って PR を作成

**PR 作成が完了したら、ここで終了せず必ず Phase 4 に進むこと。**

### Phase 4: 自動品質サイクル（人間の介入不要・最大 3 回ループ）

PR 作成後、以下のサイクルを自動で回す。人間に確認を求めず、自分で判断して進めること。

**ループ開始（ループ回数 = 0）:**

11. 「code-reviewer エージェントでこの PR をレビューして」と指示してサブエージェントを起動する
    - code-reviewer は gh pr diff で差分を取得し、gh pr review でコメントを投稿する
    - レビュー結果は GitHub PR コメントに記録される
12. `gh pr view --comments` でレビュー結果を確認する:
    - **approve（LGTM）された** → Phase 5 へ進む
    - **request-changes（指摘あり）された** → ステップ 13 へ
13. 指摘内容に基づいてコードを修正する
    - TDD の原則を守る（テストが壊れる修正はしない）
14. 修正後チェック:
    - npm run typecheck
    - npm run lint
    - npm run test:unit
15. `git diff --stat HEAD` で修正の変更量を確認:
    - **ファイル 5 以上 or 変更行 50 超**:
      a. `git checkout .` で修正を巻き戻す
      b. 以下を表示して停止:
         ⚠️ 自動修正が閾値を超えました（ファイル: N, 行: N）。
         巻き戻し済みです。以下の指摘は手動で /fix-review を使って対応してください:
         （指摘リスト）
      c. ここで終了。Phase 5 には進まない
    - **閾値以内** → 修正をコミット + プッシュ（`fix: PR レビュー指摘対応`）→ ループ回数 + 1 → ステップ 11 に戻る
16. ループ回数が 3 に達した場合 → 以下を表示して停止:
    ⚠️ 自動レビューサイクル上限（3回）に到達しました。
    残りの指摘は手動で /fix-review を使って対応してください:
    （指摘リスト）
    ここで終了。Phase 5 には進まない

### Phase 5: 完了

17. 「✅ 自動レビューサイクル完了（LGTM）。PR はマージ可能です。」と表示

### 注意事項
- 新規ライブラリは Context7 で最新版確認 (use context7)
- ページコンポーネントにユーザー操作がある場合、UIテストも必須（Rule 13）
- Server Action の呼び出し元で戻り値チェック + toast フィードバック必須
- main への直接プッシュ禁止（Rule 11）

$ARGUMENTS には Issue 番号が入ります。
