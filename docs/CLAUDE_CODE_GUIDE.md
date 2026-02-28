# Claude Code への指示ガイド（KanjouAI 開発用）

## 前提条件

Claude Code を起動する前に、以下が完了していること:

1. テンプレートファイルがローカルに配置済み
2. `claude mcp add context7 -- npx -y @upstash/context7-mcp` 実行済み

---

## Phase 0: 初回セットアップ時の指示

### Step 1: プロジェクト初期化

```
CLAUDE.md を読んで、KanjouAI プロジェクトを初期化して。

1. Context7 で Next.js / Supabase / Zod の最新安定版を確認して use context7
2. npx create-next-app@latest で作成（TypeScript, Tailwind CSS, App Router, src/ ディレクトリ）
3. 以下のパッケージをインストール:
   - @supabase/supabase-js, @supabase/ssr
   - zod（v4系）
   - @anthropic-ai/sdk
4. 全パッケージを exact version で固定（^ や ~ を外す）
5. Biome, Vitest, Playwright を設定
6. .env.example を作成

完了したら package.json のバージョンを見せて。
```

### Step 2: CI/CD

```
ci.yml を作成して。
lint → typecheck → test → build → security の5段階で、needs で依存チェーンを設定。
pr-size-check.yml も作成（300行/10ファイル超でCI失敗）。
テンプレートの .github/workflows/ を参照して。
```

### Step 3: Claude Code 環境

```
以下のファイルをプロジェクトに配置して:
- CLAUDE.md
- .claude/task-checklists.md
- .claude/commands/tdd.md
- .claude/commands/create-pr.md
- .claude/settings.json
- .github/ISSUE_TEMPLATE/feature.md
- .github/ISSUE_TEMPLATE/bug.md
- .github/PULL_REQUEST_TEMPLATE.md

テンプレートの内容をそのまま使って。
```

---

## 通常の機能開発時の指示パターン

### パターン A: Issue 番号を指定して丸ごと依頼

```
Issue #9 を実装して。
IMPLEMENTATION_PLAN.md の Issue #9 の内容に従って、TDD で進めて。
/tdd コマンドのワークフローに沿って Red-Green-Refactor で。
```

### パターン B: Issue の内容を直接貼り付けて依頼

```
以下の Issue を TDD で実装して:

## feat: 取引一覧（フィルタ + ソート + ページネーション）

### タスク
- 🔴 getTransactions Server Action のテストを先に書く
- 🟢 実装
- E2Eテスト
- 🔵 リファクタ

### 受け入れ条件
| 指標 | 基準値 |
|------|--------|
| テストカバレッジ | ≥ 80% |
| PR サイズ | ≤ 300行 |

まず 🔴 RED フェーズから始めて。テストが失敗することを確認してから実装に進んで。
```

### パターン C: フェーズ単位で依頼（効率重視）

```
Phase 1（認証 + プロフィール）を実装して。
IMPLEMENTATION_PLAN.md の Issue #6, #7, #8 の順番で進めて。
各 Issue は TDD（Red-Green-Refactor）で実装。
Issue ごとに PR を分けて、各 PR は 300行以下にして。
```

---

## TDD を明示的に指示するフレーズ

Claude Code が TDD をスキップしようとした場合に使う:

```
テストを先に書いて。実装はまだ書かないで。
```

```
テストが失敗することを確認してから実装に進んで。
```

```
/tdd で進めて。RED フェーズから。
```

---

## Context7 を使うタイミング

新しいライブラリや API を使う場面で:

```
Supabase の認証を実装して。最新の実装方法を use context7 で確認してから。
```

```
Zod 4 のバリデーションスキーマを書いて。use context7 で v4 の構文を確認して。
```

---

## デザイン作業時の指示

### v0.dev でプロトタイプを作った後

```
v0.dev で作った以下のコンポーネントをプロジェクトに取り込んで:
（v0.dev で生成されたコードを貼り付け）

プロジェクトの Tailwind 設定と合わせて、
components/ui/ ディレクトリに配置して。
```

---

## PR 作成時の指示

```
/create-pr で PR を作成して。
git diff --stat で 300行以下であることを確認してから。
```

---

## やってはいけない指示

❌ 「とりあえず全部作って」
  → Phase/Issue 単位で分割して依頼する

❌ 「テストは後で書いて」
  → TDD 必須。テストを先に書く

❌ 「最新版で入れて」（バージョン指定なし）
  → Context7 で確認してから入れるよう指示

❌ 1回の指示で 500行超の実装を依頼
  → 300行以下の PR に分割する

---

## トラブルシューティング

### Claude Code が TDD をスキップした場合

```
実装を消して。先にテストだけ書いて。テストが FAIL することを確認して。
```

### PR が 300行を超えた場合

```
git diff --stat を見せて。300行超えてるので分割案を出して。
```

### Context7 が動かない場合

```
claude mcp list で context7 が表示されるか確認して。
なければ claude mcp add context7 -- npx -y @upstash/context7-mcp を実行して。
```
