#!/usr/bin/env bash
# SessionStart hook: Injects current branch, git log, and open issues into context

set -euo pipefail

BRANCH=$(git branch --show-current 2>/dev/null || echo "")

DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ' || echo "0")
if [ "$DIRTY" -gt 0 ]; then
  DIRTY_STATUS="uncommitted (${DIRTY} files)"
else
  DIRTY_STATUS="clean"
fi

GIT_LOG=$(git log --oneline -3 2>/dev/null || echo "")

ISSUES=""
if command -v gh &>/dev/null; then
  ISSUES=$(gh issue list --state open --limit 5 --json number,title \
    --jq '.[] | "  #\(.number): \(.title)"' 2>/dev/null || echo "")
fi

CONTEXT="## Session Start Context

**Branch:** ${BRANCH:-"(detached HEAD)"}
**Uncommitted changes:** ${DIRTY_STATUS}

**Recent commits:**
${GIT_LOG:-"  (none)"}
"

if [ -n "$ISSUES" ]; then
  CONTEXT+="
**Open Issues (max 5):**
${ISSUES}
"
else
  CONTEXT+="
**Open Issues:** unavailable or none
"
fi

# Use jq for safe JSON encoding (required); exit silently if jq is not installed
if command -v jq &>/dev/null; then
  printf '%s' "$CONTEXT" | jq -Rs '{"additionalContext": .}'
else
  exit 0
fi
