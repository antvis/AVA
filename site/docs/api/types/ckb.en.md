---
title: Types about CKB
order: 1
---

<embed src='@/docs/common/style.md'></embed>

### ChartKnowledge

TS type of knowledge for a chart type.
Could be in any language or values（string), or for custom chart types(with a `toSpec` function).

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
