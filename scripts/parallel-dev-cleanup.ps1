<#
.SYNOPSIS
  並行開発 worktree クリーンアップスクリプト（PowerShell版）
.DESCRIPTION
  parallel-dev.ps1 で作成された worktree を削除し、main を最新に更新する。
.EXAMPLE
  .\scripts\parallel-dev-cleanup.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$mainBranch = "main"
$worktreeBase = Join-Path (git rev-parse --show-toplevel) ".worktrees"

# --- List worktrees ---
Write-Host "`n=== Current worktrees ===" -ForegroundColor Cyan
git worktree list

# --- Remove worktrees ---
if (Test-Path $worktreeBase) {
    $dirs = Get-ChildItem -Path $worktreeBase -Directory
    foreach ($dir in $dirs) {
        Write-Host "Removing worktree: $($dir.FullName)" -ForegroundColor Yellow
        git worktree remove $dir.FullName --force
    }
    Remove-Item -Path $worktreeBase -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Cleaned up worktree directory: $worktreeBase" -ForegroundColor Green
} else {
    Write-Host "No worktree directory found at $worktreeBase" -ForegroundColor Yellow
}

# --- Prune stale worktrees ---
git worktree prune
Write-Host "Pruned stale worktree references" -ForegroundColor Green

# --- Update main ---
Write-Host "`n=== Updating $mainBranch ===" -ForegroundColor Cyan
git checkout $mainBranch
git pull origin $mainBranch

Write-Host "`n=== Remaining worktrees ===" -ForegroundColor Cyan
git worktree list

Write-Host "`nCleanup complete." -ForegroundColor Green
