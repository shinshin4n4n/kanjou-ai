---
description: Server Actions の実装ルール
paths:
  - "app/_actions/**"
---

# Server Actions Rules

## 必須ルール

- 必ず `"use server"` ディレクティブを付ける
- 戻り値は必ず `ApiResponse<T>`
- 全エラーは `handleApiError()` で処理
- `try-catch` で囲み、catch では `handleApiError(error)` を返す
- 認証が必要なアクションは冒頭で `requireAuth()` を呼ぶ

## バリデーション

- Zod の `safeParse` を使い、`!parsed.success` で早期リターン
- Zod のエラー詳細はクライアントに返さない（固定メッセージを使う）

## データ更新

- データ変更後は `revalidatePath()` を呼ぶ

## 呼び出し元（Client Component）

- Server Action の戻り値チェック + toast フィードバック必須

> 詳細: `.claude/architecture.md`（Server Actions パターン）
