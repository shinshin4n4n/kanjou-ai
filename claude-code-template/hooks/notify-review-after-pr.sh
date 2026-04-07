#!/usr/bin/env bash
# PostToolUse hook (Bash): Prompts code review after PR creation
set -euo pipefail

INPUT=$(cat)

# Require jq for JSON parsing; exit silently if unavailable
if ! command -v jq &>/dev/null; then
  exit 0
fi

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only trigger on Bash tool running gh pr create
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

if ! echo "$COMMAND" | grep -q 'gh pr create'; then
  exit 0
fi

echo "✅ PR created. Run code-reviewer agent for automated review."

exit 0
