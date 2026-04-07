#!/usr/bin/env bash
#
# Claude Code テンプレート セットアップスクリプト
#
# Usage:
#   bash setup.sh
#
# 対話的にプロジェクト情報を入力し、.template ファイルのプレースホルダーを置換する。
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================"
echo "  Claude Code Template Setup"
echo "======================================"
echo ""

# --- 対話的入力 ---

read -r -p "プロジェクト名 (例: MyApp): " PROJECT_NAME
read -r -p "Tech Stack (例: Next.js 15 + React 19 / PostgreSQL / Vitest): " TECH_STACK
read -r -p "パッケージマネージャー (npm/pnpm/yarn) [npm]: " PACKAGE_MANAGER
PACKAGE_MANAGER="${PACKAGE_MANAGER:-npm}"

# インストールコマンド
case "$PACKAGE_MANAGER" in
    pnpm) INSTALL_COMMAND="pnpm install --frozen-lockfile" ;;
    yarn) INSTALL_COMMAND="yarn install --frozen-lockfile" ;;
    *)    INSTALL_COMMAND="npm ci" ;;
esac

read -r -p "開発サーバーコマンド [$PACKAGE_MANAGER run dev]: " DEV_COMMAND
DEV_COMMAND="${DEV_COMMAND:-$PACKAGE_MANAGER run dev}"

read -r -p "ビルドコマンド [$PACKAGE_MANAGER run build]: " BUILD_COMMAND
BUILD_COMMAND="${BUILD_COMMAND:-$PACKAGE_MANAGER run build}"

read -r -p "型チェックコマンド [$PACKAGE_MANAGER run typecheck]: " TYPECHECK_COMMAND
TYPECHECK_COMMAND="${TYPECHECK_COMMAND:-$PACKAGE_MANAGER run typecheck}"

read -r -p "Lint コマンド [$PACKAGE_MANAGER run lint]: " LINT_COMMAND
LINT_COMMAND="${LINT_COMMAND:-$PACKAGE_MANAGER run lint}"

read -r -p "Unit テストコマンド [$PACKAGE_MANAGER run test:unit]: " TEST_UNIT_COMMAND
TEST_UNIT_COMMAND="${TEST_UNIT_COMMAND:-$PACKAGE_MANAGER run test:unit}"

read -r -p "E2E テストコマンド [$PACKAGE_MANAGER run test:e2e]: " TEST_E2E_COMMAND
TEST_E2E_COMMAND="${TEST_E2E_COMMAND:-$PACKAGE_MANAGER run test:e2e}"

read -r -p "カバレッジコマンド [$PACKAGE_MANAGER run test:unit:coverage]: " TEST_COVERAGE_COMMAND
TEST_COVERAGE_COMMAND="${TEST_COVERAGE_COMMAND:-$PACKAGE_MANAGER run test:unit:coverage}"

read -r -p "カバレッジ閾値 (%) [80]: " COVERAGE_THRESHOLD
COVERAGE_THRESHOLD="${COVERAGE_THRESHOLD:-80}"

read -r -p "PR 最大行数 [300]: " PR_MAX_LINES
PR_MAX_LINES="${PR_MAX_LINES:-300}"

read -r -p "PR 最大ファイル数 [10]: " PR_MAX_FILES
PR_MAX_FILES="${PR_MAX_FILES:-10}"

read -r -p "追加の Critical Rules (空行で終了、1行1ルール):" ADDITIONAL_RULES
ADDITIONAL_RULES_TEXT=""
while IFS= read -r line; do
    [[ -z "$line" ]] && break
    ADDITIONAL_RULES_TEXT="${ADDITIONAL_RULES_TEXT}\n- **${line}**"
done

read -r -p "プロジェクト固有の Notes (空行で終了、1行1項目):" PROJECT_NOTES
PROJECT_NOTES_TEXT=""
while IFS= read -r line; do
    [[ -z "$line" ]] && break
    PROJECT_NOTES_TEXT="${PROJECT_NOTES_TEXT}\n- ${line}"
done

SETUP_DATE=$(date +%Y-%m-%d)

echo ""
echo "--- 設定内容 ---"
echo "プロジェクト名:     $PROJECT_NAME"
echo "Tech Stack:         $TECH_STACK"
echo "パッケージマネージャー: $PACKAGE_MANAGER"
echo "カバレッジ閾値:     ${COVERAGE_THRESHOLD}%"
echo "PR サイズ上限:      ${PR_MAX_LINES}行 / ${PR_MAX_FILES}ファイル"
echo "----------------"
echo ""
read -r -p "この設定でセットアップしますか？ (Y/n): " confirm
if [[ "${confirm:-Y}" =~ ^[Nn] ]]; then
    echo "キャンセルしました。"
    exit 0
fi

# --- プレースホルダー置換関数 ---

replace_placeholders() {
    local file="$1"
    sed -i.bak \
        -e "s|{{PROJECT_NAME}}|${PROJECT_NAME}|g" \
        -e "s|{{TECH_STACK}}|${TECH_STACK}|g" \
        -e "s|{{PACKAGE_MANAGER}}|${PACKAGE_MANAGER}|g" \
        -e "s|{{INSTALL_COMMAND}}|${INSTALL_COMMAND}|g" \
        -e "s|{{DEV_COMMAND}}|${DEV_COMMAND}|g" \
        -e "s|{{BUILD_COMMAND}}|${BUILD_COMMAND}|g" \
        -e "s|{{TYPECHECK_COMMAND}}|${TYPECHECK_COMMAND}|g" \
        -e "s|{{LINT_COMMAND}}|${LINT_COMMAND}|g" \
        -e "s|{{TEST_UNIT_COMMAND}}|${TEST_UNIT_COMMAND}|g" \
        -e "s|{{TEST_E2E_COMMAND}}|${TEST_E2E_COMMAND}|g" \
        -e "s|{{TEST_COVERAGE_COMMAND}}|${TEST_COVERAGE_COMMAND}|g" \
        -e "s|{{COVERAGE_THRESHOLD}}|${COVERAGE_THRESHOLD}|g" \
        -e "s|{{PR_MAX_LINES}}|${PR_MAX_LINES}|g" \
        -e "s|{{PR_MAX_FILES}}|${PR_MAX_FILES}|g" \
        -e "s|{{SETUP_DATE}}|${SETUP_DATE}|g" \
        "$file"
    rm -f "${file}.bak"
}

# --- 出力先の準備 ---

TARGET_DIR="${2:-.}"
CLAUDE_DIR="$TARGET_DIR/.claude"

echo "=== ファイルを配置中 ==="

# .claude ディレクトリ構造を作成
mkdir -p "$CLAUDE_DIR/skills/tdd"
mkdir -p "$CLAUDE_DIR/skills/create-pr"
mkdir -p "$CLAUDE_DIR/skills/implement"
mkdir -p "$CLAUDE_DIR/skills/review"
mkdir -p "$CLAUDE_DIR/skills/catchup"
mkdir -p "$CLAUDE_DIR/agents"
mkdir -p "$CLAUDE_DIR/commands"
mkdir -p "$CLAUDE_DIR/rules"
mkdir -p "$TARGET_DIR/.github/workflows"
mkdir -p "$TARGET_DIR/scripts"

# --- CLAUDE.md ---
cp "$SCRIPT_DIR/CLAUDE.md.template" "$TARGET_DIR/CLAUDE.md"
# 追加ルールと Notes を置換
if [[ -n "$ADDITIONAL_RULES_TEXT" ]]; then
    sed -i.bak "s|{{ADDITIONAL_RULES}}|${ADDITIONAL_RULES_TEXT}|g" "$TARGET_DIR/CLAUDE.md"
else
    sed -i.bak "/{{ADDITIONAL_RULES}}/d" "$TARGET_DIR/CLAUDE.md"
fi
if [[ -n "$PROJECT_NOTES_TEXT" ]]; then
    sed -i.bak "s|{{PROJECT_NOTES}}|${PROJECT_NOTES_TEXT}|g" "$TARGET_DIR/CLAUDE.md"
else
    sed -i.bak "s|{{PROJECT_NOTES}}|- (プロジェクト固有のメモをここに追加)|g" "$TARGET_DIR/CLAUDE.md"
fi
rm -f "$TARGET_DIR/CLAUDE.md.bak"
replace_placeholders "$TARGET_DIR/CLAUDE.md"

# --- Skills ---
for skill in tdd create-pr implement review catchup; do
    cp "$SCRIPT_DIR/skills/$skill/SKILL.md" "$CLAUDE_DIR/skills/$skill/SKILL.md"
    replace_placeholders "$CLAUDE_DIR/skills/$skill/SKILL.md"
done

# --- Agents ---
cp "$SCRIPT_DIR/agents/code-reviewer.md" "$CLAUDE_DIR/agents/code-reviewer.md"

# --- Commands ---
for cmd in fix-review merge; do
    cp "$SCRIPT_DIR/commands/$cmd.md" "$CLAUDE_DIR/commands/$cmd.md"
    replace_placeholders "$CLAUDE_DIR/commands/$cmd.md"
done

# --- Rules ---
cp "$SCRIPT_DIR/rules/tdd-workflow.md" "$CLAUDE_DIR/rules/tdd-workflow.md"
replace_placeholders "$CLAUDE_DIR/rules/tdd-workflow.md"

# --- settings.json ---
cp "$SCRIPT_DIR/settings.json.template" "$CLAUDE_DIR/settings.json"

# --- .claudeignore ---
cp "$SCRIPT_DIR/.claudeignore.template" "$TARGET_DIR/.claudeignore"

# --- Hooks ---
if [[ -d "$SCRIPT_DIR/hooks" ]]; then
    mkdir -p "$CLAUDE_DIR/hooks"
    cp "$SCRIPT_DIR"/hooks/*.sh "$CLAUDE_DIR/hooks/"
    chmod +x "$CLAUDE_DIR/hooks/"*.sh
fi

# --- GitHub Workflows (.template → .yml) ---
for tmpl in "$SCRIPT_DIR"/.github/workflows/*.template; do
    [[ -f "$tmpl" ]] || continue
    basename=$(basename "$tmpl" .template)
    cp "$tmpl" "$TARGET_DIR/.github/workflows/$basename"
    replace_placeholders "$TARGET_DIR/.github/workflows/$basename"
done

# --- Scripts ---
for script in "$SCRIPT_DIR"/scripts/*; do
    [[ -f "$script" ]] || continue
    cp "$script" "$TARGET_DIR/scripts/"
    chmod +x "$TARGET_DIR/scripts/$(basename "$script")"
done

echo ""
echo "======================================"
echo "  セットアップ完了!"
echo "======================================"
echo ""
echo "配置されたファイル:"
echo "  $TARGET_DIR/CLAUDE.md"
echo "  $TARGET_DIR/.claudeignore"
echo "  $CLAUDE_DIR/settings.json"
echo "  $CLAUDE_DIR/hooks/*.sh"
echo "  $CLAUDE_DIR/skills/*/SKILL.md"
echo "  $CLAUDE_DIR/agents/code-reviewer.md"
echo "  $CLAUDE_DIR/commands/*.md"
echo "  $CLAUDE_DIR/rules/tdd-workflow.md"
echo "  $TARGET_DIR/.github/workflows/*.yml"
echo "  $TARGET_DIR/scripts/*"
echo ""
echo "次のステップ:"
echo "  1. CLAUDE.md を確認・カスタマイズ"
echo "  2. .claude/settings.json の hooks パスを確認"
echo "  3. GitHub リポジトリに CLAUDE_CODE_OAUTH_TOKEN シークレットを設定"
echo "  4. git add & commit"
