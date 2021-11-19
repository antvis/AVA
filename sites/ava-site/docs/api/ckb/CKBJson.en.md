---
title: CKBJson
order: 1
---

`markdown:docs/common/style.md`



Creates a **Chart Knowledge Base** in `JSON` format.

```sign
CKBJson(lang, completed)
```

## Parameters

* **lang** * Language of the CKB content.
  * _optional_
  * `type`: *Language* extends string
  * `default`: 'en-US'
  * `options`: 'en-US', 'zh-CN'

* **completed** * To include incompleted charts or not.
  * _optional_
  * `type`: *boolean*
  * `default`: false

## Return value

*ChartKnowledgeBaseJSON* extends object

```js
{
  line_chart: {
    id: 'line_chart',
    name: 'Line Chart',
    alias: ['Lines'],
    family: ['LineCharts'],
    def: 'A line chart uses lines with segments to show changes in data in a ordinal dimension.',
    purpose: ['Comparison', 'Trend', 'Anomaly'],
    coord: ['Cartesian2D'],
    category: ['Statistic'],
    shape: ['Lines'],
    dataPres: [
      { minQty: 1, maxQty: 1, fieldConditions: ['Time', 'Ordinal'] },
      { minQty: 0, maxQty: 1, fieldConditions: ['Nominal'] },
      { minQty: 1, maxQty: 1, fieldConditions: ['Interval'] },
    ],
    channel: ['Position', 'Direction'],
    recRate: 'Recommended',
  },

  ...
}
```

## Examples

```js
import { CKBJson } from '@antv/knowledge';


// Knowledage base for all charts in English.
const knowledgeBase = CKBJson();

// Knowledage base for all charts in Chinese.
const zhKB = CKBJson('zh-CN');

// Knowledage base for completed charts in English.
const completedKB = CKBJson(undefined, true);

// Knowledage base for completed charts in Chinese.
const zhCompletedKB = CKBJson('zh-CN', true);
```


