---
title: CKB 相关类型
order: 1
---

<embed src='@/docs/common/style.md'></embed>

### ChartKnowledge

图表类型的信息结构的 TS 类型，可能是不同语言版本, 值和图表类型本身可能是自定义的。自定义图标应当包含 toSpec 方法。

```ts
type ChartKnowledge = {
  id: string;
  name: string;
  alias: string[];
  family: string[];
  def: string;
  purpose: string[];
  coord: string[];
  category: string[];
  shape: string[];
  dataPres: (Omit<DataPrerequisite, 'fieldConditions'> & { fieldConditions: string[] })[];
  channel: string[];
  recRate: string;
  toSpec?: (data: Data, dataProps: any) => Specification | null;
}
```
