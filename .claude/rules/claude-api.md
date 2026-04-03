---
description: Claude API (AI 仕訳推定) の利用ルール
paths:
  - "lib/claude/**"
---

# Claude API Rules

- **常にサーバーサイドで実行**（クライアントから直接呼ばない）
- エラーコード: `AI_ERROR`

```typescript
import { classifyTransactions } from "@/lib/claude/client";
const results = await classifyTransactions(transactions);
```

> 詳細: `.claude/architecture.md`
