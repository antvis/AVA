---
title: CKBJson
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

Creates a **Chart Knowledge Base** in `JSON` format.

```sign
CKBJson(lang: Language, completed: boolean)
```

### Arguments

* **lang** * Language of the CKB content.
  * `optional`
  * `type`: *Language* extends string
  * `default`: 'en-US'
  * `options`:
    * 'en-US'
    * 'zh-CN'

* **completed** * To include incompleted charts or not.
  * `optional`
  * `type`: *boolean*
  * `default`: false

### Returns

*ChartKnowledgeBaseJSON* extends object

```json
{
  single_line_chart: {
    id: 'single_line_chart',
    name: 'Single Line Chart',
    alias: ['Line', 'Line Chart', 'Basic Line Chart'],
    family: ['LineCharts'],
    def:
      'A single line chart is a chart that uses one line with segments to show changes in data in a ordinal dimension.',
    purpose: ['Trend'],
    coord: ['Cartesian2D'],
    category: ['Statistic'],
    shape: ['Lines'],
    dataPres: [
      { minQty: 1, maxQty: 1, fieldConditions: ['Time', 'Ordinal'] },
      { minQty: 1, maxQty: 1, fieldConditions: ['Interval'] },
    ],
    channel: ['Position', 'Direction'],
  },

  ...
}
```

### Examples

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

</div>
