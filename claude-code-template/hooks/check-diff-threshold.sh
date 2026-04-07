#!/usr/bin/env bash
# PostToolUse hook (Write|Edit): Warns when uncommitted changes exceed threshold
set -euo pipefail

# Consume stdin (Claude Code hook passes JSON via stdin)
cat > /dev/null

MAX_FILES=5
MAX_LINES=50

# Track untracked files so they appear in diff (Write creates new files)
git add -N . 2>/dev/null || true

STAT_OUTPUT=$(git diff HEAD --stat 2>/dev/null) || exit 0

if [ -z "$STAT_OUTPUT" ]; then
  exit 0
fi

SUMMARY=$(echo "$STAT_OUTPUT" | tail -1)

FILES_CHANGED=$(echo "$SUMMARY" | grep -oE '[0-9]+ files? changed' | grep -oE '[0-9]+' || echo "0")
INSERTIONS=$(echo "$SUMMARY" | grep -oE '[0-9]+ insertions?' | grep -oE '[0-9]+' || echo "0")
DELETIONS=$(echo "$SUMMARY" | grep -oE '[0-9]+ deletions?' | grep -oE '[0-9]+' || echo "0")

TOTAL_LINES=$((INSERTIONS + DELETIONS))

if [ "$FILES_CHANGED" -gt "$MAX_FILES" ]; then
  echo "diff-threshold: files changed ($FILES_CHANGED) exceeds limit ($MAX_FILES). Commit your progress before continuing." >&2
  exit 2
fi

if [ "$TOTAL_LINES" -gt "$MAX_LINES" ]; then
  echo "diff-threshold: lines changed ($TOTAL_LINES) exceeds limit ($MAX_LINES). Commit your progress before continuing." >&2
  exit 2
fi
