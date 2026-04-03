---
description: Supabase (PostgreSQL + Auth) のルールとパターン
paths:
  - "lib/supabase/**"
  - "supabase/**"
---

# Supabase Rules

## Database

- **RLS**: 全テーブルで有効化
- **Soft Delete**: `deleted_at IS NULL` パターン使用
- **金額**: INTEGER（円単位、小数を避ける）

## Client パターン

```typescript
// Server Component / Server Action
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// Client Component
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
```

## 認証

- `lib/auth.ts` の `getUser()`, `requireAuth()` を使用
- Supabase Auth を使用（NextAuth / better-auth は不使用）

> 詳細: `.claude/architecture.md`, `.claude/security.md`
