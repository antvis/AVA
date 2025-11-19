---
title: Extract
order: 1
redirect_from:
  - /zh/docs/api/extract
---

```typescript
import { AVA } from "@ava/ava";

const ava = new AVA({
  llm: {
    authorization: process.env.TBOX_LLM_AUTH || '',
    appId: process.env.TBOX_LLM_APP_ID || '',
  },
})
```
