# KanjouAI 初期セットアップ手順（Windows PowerShell）

全て PowerShell で完結します。上から順にコピペして実行してください。

---

## Step 0: 前提ツール確認

```powershell
git --version
```

```powershell
gh --version
```

```powershell
node --version
```

### Step 0.5: GitHub CLI 未インストールの場合

```powershell
winget install GitHub.cli
```

```powershell
# GitHub CLI にログイン（初回のみ。ブラウザが開くので認証する）
gh auth login
```

---

## Step 1: リポジトリ作成

```powershell
mkdir kanjou-ai
```

```powershell
cd kanjou-ai
```

```powershell
git init
```

```powershell
gh repo create kanjou-ai --public --source=. --remote=origin
```

---

## Step 2: テンプレートファイル配置

ダウンロードした ZIP を展開してから実行。
パスは自分の環境に合わせて変更してください。

```powershell
# ZIP展開（ダウンロードフォルダにある想定）
Expand-Archive -Path "$env:USERPROFILE\Downloads\kanjou-ai-template.zip" -DestinationPath "$env:USERPROFILE\Downloads" -Force
```

```powershell
# テンプレートの中身を全てコピー
Copy-Item -Path "$env:USERPROFILE\Downloads\kanjou-ai-template\*" -Destination . -Recurse -Force
```

```powershell
# 配置されたか確認
Get-ChildItem -Force
Get-Content CLAUDE.md | Select-Object -First 5
```

---

## Step 3: 初回コミット + プッシュ

```powershell
git add .
```

```powershell
git commit -m "chore: プロジェクトテンプレート配置"
```

```powershell
git push -u origin main
```

---

## Step 4: Claude Code 起動 + MCP設定

```powershell
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

```powershell
claude
```

---

## Step 5: Claude Code への最初の指示

Claude Code が起動したら、以下をそのまま貼り付ける:

```
CLAUDE.md を読んで、このプロジェクトのルールを理解して。
次に docs/IMPLEMENTATION_PLAN.md を読んで。

Issue #1（プロジェクト初期化）から始めて。
Context7 で Next.js / Supabase / Zod の最新安定版を確認してからインストールして。
全パッケージは exact version で固定（^ や ~ を外す）。

完了したら package.json のバージョン一覧を見せて。
```

---

## Step 6以降: Issue ごとに指示

### Issue #2（CI/CD + Vercel）

```
IMPLEMENTATION_PLAN.md の Issue #2 を実装して。
ci.yml と pr-size-check.yml を作成。
テンプレートの .github/workflows/ の内容に従って。
```

### Issue #3（Claude Code 環境設定）

```
IMPLEMENTATION_PLAN.md の Issue #3 を実装して。
テンプレートに既にあるファイルはそのまま使って、不足があれば追加して。
```

### Issue #4（DB初期スキーマ）

```
IMPLEMENTATION_PLAN.md の Issue #4 を実装して。
supabase init してから、テンプレートの migration SQL を配置して。
ローカルで supabase db reset が通ることを確認して。
```

### Issue #5（共通ライブラリ基盤）⚠️ TDD開始

```
IMPLEMENTATION_PLAN.md の Issue #5 を TDD で実装して。
/tdd コマンドのワークフローに従って。

まず 🔴 RED: handleApiError のテストを先に書いて。
テストが失敗することを確認してから実装に進んで。
```

### Issue #6〜（以降は同じパターン）

```
IMPLEMENTATION_PLAN.md の Issue #X を TDD で実装して。
テストを先に書いて。実装はまだ書かないで。
```

---

## PR 作成時（毎回）

```
/create-pr で PR を作成して。
git diff --stat で 300行以下 & 10ファイル以下であることを確認してから。
```

---

## よく使うコマンド

```powershell
# テスト実行
npm run test:unit
```

```powershell
# カバレッジ確認
npm run test:unit -- --coverage
```

```powershell
# Lint
npx biome check .
```

```powershell
# 型チェック
npx tsc --noEmit
```

```powershell
# ビルド
npm run build
```

```powershell
# Supabase ローカル起動
npx supabase start
```

```powershell
# Supabase マイグレーションリセット
npx supabase db reset
```

```powershell
# Supabase 型生成
npx supabase gen types typescript --local > src\lib\supabase\database.types.ts
```
