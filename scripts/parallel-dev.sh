#!/usr/bin/env bash
#
# claude -p 並行開発ヘルパースクリプト（bash / WSL 対応）
#
# Usage:
#   ./scripts/parallel-dev.sh 190 191 192
#   ./scripts/parallel-dev.sh --cleanup
#
set -euo pipefail

MAIN_BRANCH="main"
REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_BASE="$REPO_ROOT/.worktrees"

# ------------------------------------------------------------------
# Cleanup mode
# ------------------------------------------------------------------
if [[ "${1:-}" == "--cleanup" ]]; then
    echo ""
    echo "=== Current worktrees ==="
    git worktree list

    if [[ -d "$WORKTREE_BASE" ]]; then
        for dir in "$WORKTREE_BASE"/*/; do
            [[ -d "$dir" ]] || continue
            status=$(git -C "$dir" status --porcelain 2>&1 || true)
            if [[ -n "$status" ]]; then
                echo "WARNING: Worktree '$dir' has uncommitted changes:"
                echo "$status"
                read -r -p "Remove anyway? (y/N) " confirm
                if [[ "$confirm" != "y" ]]; then
                    echo "Skipped: $dir"
                    continue
                fi
            fi
            echo "Removing worktree: $dir"
            git worktree remove "$dir" --force || true
        done
        rm -rf "$WORKTREE_BASE"
        echo "Cleaned up worktree directory: $WORKTREE_BASE"
    else
        echo "No worktree directory found at $WORKTREE_BASE"
    fi

    git worktree prune
    echo "Pruned stale worktree references"

    echo ""
    echo "=== Updating $MAIN_BRANCH ==="
    git checkout "$MAIN_BRANCH"
    git pull origin "$MAIN_BRANCH"

    echo ""
    echo "=== Remaining worktrees ==="
    git worktree list

    echo ""
    echo "Cleanup complete."
    exit 0
fi

# ------------------------------------------------------------------
# Parallel dev mode
# ------------------------------------------------------------------
if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <issue-number> [issue-number ...]"
    echo "       $0 --cleanup"
    exit 1
fi

ISSUE_NUMBERS=("$@")

# --- Update main ---
echo ""
echo "=== Updating $MAIN_BRANCH ==="
git checkout "$MAIN_BRANCH"
git pull origin "$MAIN_BRANCH"

# --- Disable ANTHROPIC_API_KEY so claude -p uses Max plan ---
export ANTHROPIC_API_KEY=""
echo "ANTHROPIC_API_KEY disabled (Max plan mode)"

# --- Prepare worktrees ---
mkdir -p "$WORKTREE_BASE"

PIDS=()
declare -A PID_ISSUE_MAP
declare -A PID_BRANCH_MAP
declare -A PID_LOG_MAP

for issue in "${ISSUE_NUMBERS[@]}"; do
    echo ""
    echo "=== Processing Issue #$issue ==="

    # Get issue title for branch name
    issue_title=$(gh issue view "$issue" --json title --jq ".title" 2>&1) || {
        echo "WARNING: Failed to fetch Issue #$issue — skipping: $issue_title"
        continue
    }

    # Generate branch name
    slug=$(echo "$issue_title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 -]//g' | tr -s ' ' '-' | cut -c1-40 | sed 's/-$//')
    branch_name="feature/issue-${issue}-${slug}"

    # Check if branch already exists
    if git branch --list "$branch_name" | grep -q .; then
        echo "WARNING: Branch '$branch_name' already exists — skipping Issue #$issue"
        continue
    fi

    # Check if worktree already exists
    worktree_path="$WORKTREE_BASE/issue-$issue"
    if [[ -d "$worktree_path" ]]; then
        echo "WARNING: Worktree '$worktree_path' already exists — skipping Issue #$issue"
        continue
    fi

    # Create worktree + branch
    git worktree add -b "$branch_name" "$worktree_path" "$MAIN_BRANCH"
    echo "Created worktree: $worktree_path (branch: $branch_name)"

    # Log file
    log_file="/tmp/claude-${issue}.log"

    # Launch claude -p in background
    prompt="gh issue view $issue で Issue の内容を確認し、/implement の手順に従って実装してください。"
    (
        cd "$worktree_path"
        ANTHROPIC_API_KEY="" claude -p "$prompt" 2>&1 | tee "$log_file"
    ) &

    pid=$!
    PIDS+=("$pid")
    PID_ISSUE_MAP[$pid]=$issue
    PID_BRANCH_MAP[$pid]=$branch_name
    PID_LOG_MAP[$pid]=$log_file

    echo "Started claude -p for Issue #$issue (PID: $pid, log: $log_file)"
done

if [[ ${#PIDS[@]} -eq 0 ]]; then
    echo "WARNING: No jobs were started."
    exit 0
fi

# --- Wait for all jobs ---
echo ""
echo "=== Waiting for ${#PIDS[@]} session(s) to complete ==="
echo "Logs:"
for pid in "${PIDS[@]}"; do
    echo "  Issue #${PID_ISSUE_MAP[$pid]}: ${PID_LOG_MAP[$pid]}"
done

# Wait and collect results
declare -A PID_EXIT_MAP
for pid in "${PIDS[@]}"; do
    wait "$pid" && PID_EXIT_MAP[$pid]=0 || PID_EXIT_MAP[$pid]=$?
done

# --- Show results ---
echo ""
echo "=== Results ==="
for pid in "${PIDS[@]}"; do
    issue=${PID_ISSUE_MAP[$pid]}
    branch=${PID_BRANCH_MAP[$pid]}
    exit_code=${PID_EXIT_MAP[$pid]}
    if [[ $exit_code -eq 0 ]]; then
        echo "[OK]   Issue #$issue — branch: $branch"
    else
        echo "[FAIL] Issue #$issue — branch: $branch (exit: $exit_code)"
    fi
done

# --- Show PRs ---
echo ""
echo "=== Open PRs ==="
gh pr list --state open --author "@me"

echo ""
echo "Done. Run '$0 --cleanup' to clean up worktrees."
