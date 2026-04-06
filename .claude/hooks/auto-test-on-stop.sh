#!/usr/bin/env bash
set -euo pipefail

# Read stdin JSON and check stop_hook_active flag (infinite loop prevention)
STDIN=$(cat)
STOP_HOOK_ACTIVE=$(echo "$STDIN" | grep -o '"stop_hook_active"[[:space:]]*:[[:space:]]*true' || true)

if [ -n "$STOP_HOOK_ACTIVE" ]; then
  exit 0
fi

# Get changed TypeScript files
CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null || true)

if [ -z "$CHANGED_FILES" ]; then
  exit 0
fi

TS_FILES=$(echo "$CHANGED_FILES" | grep -E '\.(ts|tsx)$' || true)

if [ -z "$TS_FILES" ]; then
  exit 0
fi

echo "🧪 TypeScript ファイルの変更を検出。ユニットテストを自動実行..." >&2

if npm run test:unit --silent 2>&1; then
  echo "✅ ユニットテスト通過" >&2
  exit 0
else
  echo "❌ ユニットテスト失敗。修正してください。" >&2
  exit 2
fi
