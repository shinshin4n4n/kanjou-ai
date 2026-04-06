#!/usr/bin/env bash
# SessionStart hook: Injects current branch, git log, and open issues into context

set -euo pipefail

BRANCH=$(git branch --show-current 2>/dev/null || echo "")

DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ' || echo "0")
if [ "$DIRTY" -gt 0 ]; then
  DIRTY_STATUS="あり（${DIRTY}ファイル）"
else
  DIRTY_STATUS="なし"
fi

GIT_LOG=$(git log --oneline -3 2>/dev/null || echo "")

ISSUES=""
if command -v gh &>/dev/null; then
  ISSUES=$(gh issue list --state open --limit 5 --json number,title \
    --jq '.[] | "  #\(.number): \(.title)"' 2>/dev/null || echo "")
fi

CONTEXT="## セッション開始時コンテキスト

**ブランチ:** ${BRANCH:-"(detached HEAD)"}
**未コミット変更:** ${DIRTY_STATUS}

**直近のコミット:**
${GIT_LOG:-"  (なし)"}
"

if [ -n "$ISSUES" ]; then
  CONTEXT+="
**未処理 Issue（最大5件）:**
${ISSUES}
"
else
  CONTEXT+="
**未処理 Issue:** 取得不可またはなし
"
fi

# Use jq if available, otherwise produce JSON manually with printf
if command -v jq &>/dev/null; then
  printf '%s' "$CONTEXT" | jq -Rs '{"additionalContext": .}'
else
  # Fallback: escape backslashes and double-quotes, replace newlines with \n
  ESCAPED=$(printf '%s' "$CONTEXT" | sed 's/\/\\/g; s/"/\\"/g' | awk '{printf "%s\n", $0}')
  printf '{"additionalContext": "%s"}\n' "$ESCAPED"
fi
