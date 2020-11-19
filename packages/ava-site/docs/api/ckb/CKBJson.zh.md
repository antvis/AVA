---
title: CKBJson
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

得到一个 `JSON` 格式的 **图表知识库（Chart Knowledge Base）**，以下简称 CKB。

```sign
CKBJson(lang, completed)
```

### 参数

* **lang** * CKB 内容所使用的语言。
  * _可选参数_
  * `参数类型`: *Language* extends string
  * `默认值`: 'en-US'
  * `选项`: 'en-US', 'zh-CN'

* **completed** * 是否只包含信息完整的图表类型。
  * _可选参数_
  * `参数类型`: *boolean*
  * `默认值`: false

### 返回值

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

### 示例

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
