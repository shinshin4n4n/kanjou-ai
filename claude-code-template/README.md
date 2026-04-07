# Claude Code Project Template

Claude Code を活用した開発プロジェクトのテンプレートセット。
TDD ワークフロー、自動レビュー、CI 自動修正などを含む包括的な開発環境を提供します。

## 含まれるファイル

| カテゴリ | ファイル | 説明 |
|---------|---------|------|
| **設定** | `CLAUDE.md.template` | プロジェクトルール・コマンド定義 |
| | `settings.json.template` | Claude Code ハーネス設定 |
| | `.claudeignore.template` | Claude Code 除外パターン |
| **Skills** | `skills/tdd/SKILL.md` | TDD Red-Green-Refactor ワークフロー |
| | `skills/create-pr/SKILL.md` | PR 作成（テスト・Lint・サイズチェック付き） |
| | `skills/implement/SKILL.md` | Issue 実装（TDD + 自動レビューサイクル） |
| | `skills/review/SKILL.md` | PR レビュー |
| | `skills/catchup/SKILL.md` | セッション再開時のコンテキスト再構築 |
| **Agents** | `agents/code-reviewer.md` | PR 自動レビューエージェント |
| **Commands** | `commands/fix-review.md` | レビュー指摘修正 |
| | `commands/merge.md` | PR スカッシュマージ |
| **Rules** | `rules/tdd-workflow.md` | TDD ルール（テストファイル編集時に自動適用） |
| **Hooks** | `hooks/*.sh` | セッション開始・停止・差分チェック等のフック |
| **Workflows** | `.github/workflows/claude-assistant.yml.template` | @claude メンションハンドラ |
| | `.github/workflows/ci-auto-fix.yml.template` | CI 失敗時の自動修正 |
| **Scripts** | `scripts/parallel-dev.sh` | 並行開発ヘルパー（bash/WSL） |
| | `scripts/parallel-dev.ps1` | 並行開発ヘルパー（PowerShell） |
| | `scripts/parallel-dev-cleanup.ps1` | worktree クリーンアップ（PowerShell） |

## セットアップ

### 前提条件

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) がインストール済み
- [GitHub CLI (`gh`)](https://cli.github.com/) がインストール済み
- Git リポジトリが初期化済み

### 手順

1. **テンプレートディレクトリをプロジェクトにコピー**

   ```bash
   # このリポジトリをクローンまたはダウンロード
   git clone <repository-url>
   cd claude-code-template
   ```

2. **セットアップスクリプトを実行**

   ```bash
   bash setup.sh
   ```

   対話的にプロジェクト情報を入力します:
   - プロジェクト名
   - Tech Stack
   - パッケージマネージャー（npm/pnpm/yarn）
   - 各種コマンド（dev, build, typecheck, lint, test）
   - カバレッジ閾値、PR サイズ上限

3. **生成されたファイルを確認・カスタマイズ**

   - `CLAUDE.md`: Critical Rules やプロジェクト固有のメモを編集
   - `.claude/settings.json`: hooks のパスや許可コマンドを調整
   - `.github/workflows/*.yml`: ワークフローの条件を調整

4. **GitHub シークレットを設定**

   ```
   CLAUDE_CODE_OAUTH_TOKEN — Claude Code の OAuth トークン
   ```

5. **コミット & プッシュ**

   ```bash
   git add .
   git commit -m "feat: Claude Code 開発環境セットアップ"
   git push
   ```

## プレースホルダー一覧

| プレースホルダー | 説明 | デフォルト値 |
|----------------|------|-------------|
| `{{PROJECT_NAME}}` | プロジェクト名 | — |
| `{{TECH_STACK}}` | 技術スタック | — |
| `{{PACKAGE_MANAGER}}` | パッケージマネージャー | `npm` |
| `{{INSTALL_COMMAND}}` | 依存インストールコマンド | `npm ci` |
| `{{DEV_COMMAND}}` | 開発サーバーコマンド | `npm run dev` |
| `{{BUILD_COMMAND}}` | ビルドコマンド | `npm run build` |
| `{{TYPECHECK_COMMAND}}` | 型チェックコマンド | `npm run typecheck` |
| `{{LINT_COMMAND}}` | Lint コマンド | `npm run lint` |
| `{{TEST_UNIT_COMMAND}}` | Unit テストコマンド | `npm run test:unit` |
| `{{TEST_E2E_COMMAND}}` | E2E テストコマンド | `npm run test:e2e` |
| `{{TEST_COVERAGE_COMMAND}}` | カバレッジコマンド | `npm run test:unit:coverage` |
| `{{COVERAGE_THRESHOLD}}` | カバレッジ閾値 (%) | `80` |
| `{{PR_MAX_LINES}}` | PR 最大行数 | `300` |
| `{{PR_MAX_FILES}}` | PR 最大ファイル数 | `10` |
| `{{TEST_COMMAND}}` | テストコマンド（hooks 用） | `npm run test:unit` |
| `{{SOURCE_EXT}}` | ソースファイル拡張子（hooks 用） | `ts,tsx` |

## 使い方

セットアップ完了後、Claude Code で以下のコマンドが使えます:

```
/tdd          — TDD サイクルを開始
/implement 42 — Issue #42 を TDD で実装 → PR 作成 → 自動レビュー
/create-pr    — PR を作成（テスト・Lint・サイズチェック付き）
/review 99    — PR #99 をレビュー
/catchup      — セッション再開時にコンテキスト再構築
/fix-review 99 — PR #99 のレビュー指摘を修正
/merge 99     — PR #99 をスカッシュマージ
```

### 並行開発

複数の Issue を同時に実装:

```bash
# bash / WSL
./scripts/parallel-dev.sh 42 43 44

# PowerShell
.\scripts\parallel-dev.ps1 42 43 44

# クリーンアップ
./scripts/parallel-dev.sh --cleanup          # bash
.\scripts\parallel-dev-cleanup.ps1           # PowerShell
```
