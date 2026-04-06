#!/bin/bash
OUTPUT_FILE="$CLAUDE_PROJECT_DIR/.claude/last-session-state.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
BRANCH=$(git -C "$CLAUDE_PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

{
  echo "# Last Session State"
  echo ""
  echo "**Saved at:** $TIMESTAMP"
  echo "**Branch:** $BRANCH"
  echo ""
  echo "## Changed Files"
  echo ""
  echo '```'
  git -C "$CLAUDE_PROJECT_DIR" diff --name-only HEAD 2>/dev/null || echo "(no changes)"
  echo '```'
  echo ""
  echo "## Change Stats"
  echo ""
  echo '```'
  git -C "$CLAUDE_PROJECT_DIR" diff --stat HEAD 2>/dev/null || echo "(no changes)"
  echo '```'
  echo ""
  echo "## Recent Commits (last 5)"
  echo ""
  echo '```'
  git -C "$CLAUDE_PROJECT_DIR" log --oneline -5 2>/dev/null || echo "(no commits)"
  echo '```'
} > "$OUTPUT_FILE"

echo '{"additionalContext": "作業状態を .claude/last-session-state.md に保存しました。コンパクション後はこのファイルを参照して作業を再開できます。"}'
