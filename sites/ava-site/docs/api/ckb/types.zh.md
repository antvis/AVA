---
title: Types & Interfaces
order: 4
---

`markdown:docs/common/style.md`



一些相关类型和接口的描述：

```js
import { ChartKnowledge, DataPrerequisite } from '@antv/knowledge';
```

## ChartKnowledge

```ts
interface ChartKnowledge {
  id: ChartID;
  name: string;
  alias: string[];
  family?: Family[];
  def?: string;
  purpose?: Purpose[];
  coord?: CoordinateSystem[];
  category?: GraphicCategory[];
  shape?: Shape[];
  dataPres?: DataPrerequisite[];
  channel?: Channel[];
}
```

## DataPrerequisite

```ts
interface DataPrerequisite {
  minQty: number;
  maxQty: number | '*';
  fieldConditions: LevelOfMeasurement[];
}
```

## Language

```ts
type Language = 'en-US' | 'zh-CN';
```

## TransKnowledgeProps

```ts
interface TransKnowledgeProps {
  name: string;
  alias: string[];
  def: string;
}
```


