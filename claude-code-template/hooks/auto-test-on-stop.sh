#!/usr/bin/env bash
# Stop hook: Auto-runs tests when source files have uncommitted changes
# Customize TEST_CMD and FILE_PATTERN for your project
set -euo pipefail

TEST_CMD="{{TEST_COMMAND}}"        # e.g. "npm run test:unit"
FILE_PATTERN='\.(__TEST_EXT__)$'   # e.g. '\.(ts|tsx)$' or '\.(py)$'

# Read stdin JSON and check stop_hook_active flag (infinite loop prevention)
STDIN=$(cat)
STOP_HOOK_ACTIVE=$(echo "$STDIN" | grep -o '"stop_hook_active"[[:space:]]*:[[:space:]]*true' || true)

if [ -n "$STOP_HOOK_ACTIVE" ]; then
  exit 0
fi

# Get changed files
CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null || true)

if [ -z "$CHANGED_FILES" ]; then
  exit 0
fi

MATCHED_FILES=$(echo "$CHANGED_FILES" | grep -E "$FILE_PATTERN" || true)

if [ -z "$MATCHED_FILES" ]; then
  exit 0
fi

echo "🧪 Source file changes detected. Running tests automatically..." >&2

if $TEST_CMD --silent 2>&1; then
  echo "✅ Tests passed" >&2
  exit 0
else
  echo "❌ Tests failed. Please fix before continuing." >&2
  exit 2
fi
