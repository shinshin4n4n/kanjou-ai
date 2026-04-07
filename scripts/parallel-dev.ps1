<#
.SYNOPSIS
  claude -p 並行開発ヘルパースクリプト（PowerShell版）
.DESCRIPTION
  Issue 番号リストを受け取り、worktree 作成 → claude -p 並行実行を自動化する。
  ANTHROPIC_API_KEY を無効化し、Max プランで実行される。
.EXAMPLE
  .\scripts\parallel-dev.ps1 190 191 192
#>

param(
    [Parameter(Mandatory = $true, Position = 0, ValueFromRemainingArguments = $true)]
    [int[]]$IssueNumbers
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$mainBranch = "main"
$worktreeBase = Join-Path (git rev-parse --show-toplevel) ".worktrees"

# --- Validate ---
if ($IssueNumbers.Count -eq 0) {
    Write-Error "Usage: .\scripts\parallel-dev.ps1 <issue-number> [issue-number ...]"
    exit 1
}

# --- Update main ---
Write-Host "`n=== Updating $mainBranch ===" -ForegroundColor Cyan
git checkout $mainBranch
git pull origin $mainBranch

# --- Disable ANTHROPIC_API_KEY so claude -p uses Max plan ---
$originalApiKey = $env:ANTHROPIC_API_KEY
$env:ANTHROPIC_API_KEY = ""
Write-Host "ANTHROPIC_API_KEY disabled (Max plan mode)" -ForegroundColor Yellow

# --- Prepare worktrees ---
if (-not (Test-Path $worktreeBase)) {
    New-Item -ItemType Directory -Path $worktreeBase | Out-Null
}

$jobs = @()

foreach ($issue in $IssueNumbers) {
    Write-Host "`n=== Processing Issue #$issue ===" -ForegroundColor Cyan

    # Get issue title for branch name
    $issueTitle = gh issue view $issue --json title --jq ".title" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to fetch Issue #$issue — skipping: $issueTitle"
        continue
    }

    # Generate branch name: feature/issue-{number}-{slug}
    $slug = $issueTitle.ToLower() -replace '[^a-z0-9\s-]', '' -replace '\s+', '-'
    if ($slug.Length -gt 40) { $slug = $slug.Substring(0, 40) }
    $slug = $slug.TrimEnd('-')
    $branchName = "feature/issue-$issue-$slug"

    # Check if branch already exists
    $existingBranch = git branch --list $branchName 2>&1
    if ($existingBranch) {
        Write-Warning "Branch '$branchName' already exists — skipping Issue #$issue"
        continue
    }

    # Check if worktree already exists
    $worktreePath = Join-Path $worktreeBase "issue-$issue"
    if (Test-Path $worktreePath) {
        Write-Warning "Worktree '$worktreePath' already exists — skipping Issue #$issue"
        continue
    }

    # Create worktree + branch
    git worktree add -b $branchName $worktreePath $mainBranch
    Write-Host "Created worktree: $worktreePath (branch: $branchName)" -ForegroundColor Green

    # Log file
    $logFile = "/tmp/claude-$issue.log"

    # Launch claude -p in background
    $prompt = "gh issue view $issue で Issue の内容を確認し、/implement の手順に従って実装してください。"
    $job = Start-Job -ScriptBlock {
        param($WorkDir, $Prompt, $LogFile)
        Set-Location $WorkDir
        $env:ANTHROPIC_API_KEY = ""
        claude -p $Prompt 2>&1 | Tee-Object -FilePath $LogFile
    } -ArgumentList $worktreePath, $prompt, $logFile

    $jobs += @{
        Issue    = $issue
        Branch   = $branchName
        Worktree = $worktreePath
        LogFile  = $logFile
        Job      = $job
    }

    Write-Host "Started claude -p for Issue #$issue (log: $logFile)" -ForegroundColor Green
}

if ($jobs.Count -eq 0) {
    Write-Warning "No jobs were started."
    $env:ANTHROPIC_API_KEY = $originalApiKey
    exit 0
}

# --- Wait for all jobs ---
Write-Host "`n=== Waiting for $($jobs.Count) session(s) to complete ===" -ForegroundColor Cyan
Write-Host "Logs:"
foreach ($j in $jobs) {
    Write-Host "  Issue #$($j.Issue): $($j.LogFile)"
}

$jobs | ForEach-Object { $_.Job } | Wait-Job | Out-Null

# --- Show results ---
Write-Host "`n=== Results ===" -ForegroundColor Cyan
foreach ($j in $jobs) {
    $state = $j.Job.State
    $icon = if ($state -eq "Completed") { "[OK]" } else { "[FAIL]" }
    Write-Host "$icon Issue #$($j.Issue) — branch: $($j.Branch) ($state)"
    Receive-Job -Job $j.Job | Out-Null
    Remove-Job -Job $j.Job
}

# --- Show PRs ---
Write-Host "`n=== Open PRs ===" -ForegroundColor Cyan
gh pr list --state open --author "@me"

# --- Restore API key ---
$env:ANTHROPIC_API_KEY = $originalApiKey
Write-Host "`nDone. Run .\scripts\parallel-dev-cleanup.ps1 to clean up worktrees." -ForegroundColor Green
