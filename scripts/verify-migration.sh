#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  echo "=== Stopping Supabase local instance ==="
  supabase stop
}
trap cleanup EXIT

echo "=== Starting Supabase local instance ==="
supabase start -x realtime,storage,imgproxy,edge-runtime,logflare,vector,supavisor

echo "=== Resetting database (applying all migrations) ==="
supabase db reset

echo "=== Checking for schema drift ==="
DIFF_OUTPUT=$(supabase db diff 2>&1) || true

if [ -n "$DIFF_OUTPUT" ]; then
  echo "::error::Schema drift detected!"
  echo "$DIFF_OUTPUT"
  exit 1
fi

echo "=== All migrations applied successfully. No schema drift detected. ==="
