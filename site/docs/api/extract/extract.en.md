---
title: Data Processing (Extract)
order: 1
redirect_from:
  - /zh/docs/api/extract
---

```typescript
import { Advisor } from "@ava/advisor";

const advisor = new Advisor({
  llm: {
    authorization: process.env.TBOX_LLM_AUTH || '',
    appId: process.env.TBOX_LLM_APP_ID || '',
  },
})
```