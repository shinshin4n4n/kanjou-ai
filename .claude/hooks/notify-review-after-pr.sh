#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Bash ツールの gh pr create コマンドのみに反応
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

if ! echo "$COMMAND" | grep -q 'gh pr create'; then
  exit 0
fi

echo "✅ PR 作成完了。implement.md Phase 4 に従い、code-reviewer エージェントで自動レビューを開始してください。レビューが完了するまでこのコマンドは終了しないでください。"

exit 0
