#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOOK_SCRIPT="$SCRIPT_DIR/.claude/hooks/check-diff-threshold.sh"

PASS=0
FAIL=0
TMPDIR_BASE=""

cleanup() {
  if [ -n "$TMPDIR_BASE" ] && [ -d "$TMPDIR_BASE" ]; then
    rm -rf "$TMPDIR_BASE"
  fi
}
trap cleanup EXIT

TMPDIR_BASE=$(mktemp -d)

# Helper: create a temp git repo with N files, each with M lines of content
# then stage changes so git diff --stat shows them
setup_repo() {
  local dir="$1"
  local num_files="$2"
  local lines_per_file="$3"

  mkdir -p "$dir"
  cd "$dir"
  git init -q
  git commit --allow-empty -m "init" -q

  for i in $(seq 1 "$num_files"); do
    for j in $(seq 1 "$lines_per_file"); do
      echo "line-$j" >> "file-$i.txt"
    done
    git add "file-$i.txt"
  done
}

run_test() {
  local test_name="$1"
  local expected_exit="$2"
  local actual_exit=0

  echo "" | bash "$HOOK_SCRIPT" || actual_exit=$?

  if [ "$actual_exit" -eq "$expected_exit" ]; then
    echo "  PASS: $test_name (exit=$actual_exit)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $test_name (expected=$expected_exit, got=$actual_exit)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== check-diff-threshold.sh tests ==="

# Test 1: Under threshold (4 files, 10 lines each = 40 lines total)
echo ""
echo "Test 1: Under threshold (4 files, 40 lines)"
REPO1="$TMPDIR_BASE/test1"
setup_repo "$REPO1" 4 10
run_test "4 files / 40 lines → exit 0" 0

# Test 2: File count exceeds threshold (6 files, 5 lines each = 30 lines)
echo ""
echo "Test 2: File count exceeds (6 files, 30 lines)"
REPO2="$TMPDIR_BASE/test2"
setup_repo "$REPO2" 6 5
run_test "6 files / 30 lines → exit 2" 2

# Test 3: Line count exceeds threshold (3 files, 20 lines each = 60 lines)
echo ""
echo "Test 3: Line count exceeds (3 files, 60 lines)"
REPO3="$TMPDIR_BASE/test3"
setup_repo "$REPO3" 3 20
run_test "3 files / 60 lines → exit 2" 2

# Test 4: Boundary - exactly at threshold (5 files, 10 lines each = 50 lines)
echo ""
echo "Test 4: Boundary (5 files, 50 lines) - should pass"
REPO4="$TMPDIR_BASE/test4"
setup_repo "$REPO4" 5 10
run_test "5 files / 50 lines → exit 0" 0

# Test 5: No changes (clean working tree)
echo ""
echo "Test 5: No changes (clean tree)"
REPO5="$TMPDIR_BASE/test5"
mkdir -p "$REPO5"
cd "$REPO5"
git init -q
git commit --allow-empty -m "init" -q
run_test "no changes → exit 0" 0

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
