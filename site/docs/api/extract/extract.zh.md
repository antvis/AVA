---
title: 简介
order: 1
redirect_from:
  - /zh/docs/api/extract
---

## extract 方法

```typescript
import { AVA } from "@antv/ava";

const ava = new AVA({
  llm: {
    authorization: process.env.TBOX_LLM_AUTH || 'your tbox authorization',
    appId: process.env.TBOX_LLM_APP_ID || 'your tbox appId',
  },
});

ava.extract(`请帮我分析数据: 不同社交媒体平台的用户增长情况，2018 年 Facebook 用户增长 8%，Twitter 用户增长 12%，Instagram 用户增长 22%`)
```

### 调用参数
| 参数 | 类型 | 描述 |
| --- | --- | --- |
| input | string | 需要提取的文本 |

### 返回结果
| 参数 | 类型 | 描述 |
| --- | --- | --- |
| result | DataShard[] | 数据抽取结果 |
