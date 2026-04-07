---
description: TDD Red-Green-Refactor ワークフローとテスト規約
paths:
  - "**/*.test.*"
  - "**/__tests__/**"
---

# TDD Workflow

## Red-Green-Refactor サイクル（必須）

1. 🔴 RED: 失敗するテストを先に書く → `{{TEST_UNIT_COMMAND}}` で FAIL を確認
2. 🟢 GREEN: テストを通す最小限の実装 → PASS を確認
3. 🔵 REFACTOR: テストが通る状態を維持しながらリファクタ

- テストを書く前に実装コードを書かない
- 1サイクルの粒度は 1メソッド / 1ユースケース単位
- `/tdd` コマンドで TDD サイクルを開始

## テスト配置

`{対象ファイルのパス}/__tests__/{ファイル名}.test.ts`

## Unit Testing

- カバレッジ {{COVERAGE_THRESHOLD}}%以上必須
- 実行: `{{TEST_UNIT_COMMAND}}`
- パターン: AAA（Arrange-Act-Assert）

## E2E Testing

- 実行: `{{TEST_E2E_COMMAND}}`

## CI

- 全テスト通過必須、`continue-on-error` は使わない
- TypeScript 型チェックも必須

> 詳細: `.claude/testing.md`, `.claude/task-checklists.md`
