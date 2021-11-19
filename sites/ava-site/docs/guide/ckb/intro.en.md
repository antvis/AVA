---
title: Introduction to CKB
order: 0
---

`markdown:docs/common/style.md`




Chart Knowledge Base (CKB) is a library offers knowledge base for chart wikis in a JSON format. 

The JSON is like this:

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

## ✨ Features

### Consistency for Chart Taxonomy

The contribution of the whole data visualization community makes this library a standard. You don't have to struggle with different names or alias or definition of a same chart type.

### To Build Chart Dictionaries in Seconds

With AVA/CKB, you can quickly build your chart dictionary product like this: <img src="https://gw.alipayobjects.com/zos/antfincdn/1yMwFkBvyV/chartcube-logo-cube.svg" width="18"> [ChartCube](https://chartcube.alipay.com/guide)

<div align="center">
<img src="https://gw.alipayobjects.com/zos/antfincdn/%24lJREleYKL/Screen%252520Shot%2525202020-02-14%252520at%2525206.41.07%252520PM.png" width="600" />
</div>

### The Base for Automatic Chart Recommendation

You can easily build a chart type recommendation system with this knowledge base and your customized rules.

## 📦 Installation

```bash
$ npm install @antv/knowledge
```

## 🔨 Usage

```js
import { CKBJson } from '@antv/knowledge';


// Knowledage base for all charts in English.
const knowledgeBase = CKBJson();

// Knowledage base for completed charts in Chinese.
const zhCompletedKB = CKBJson('zh-CN', true);
```

### Demo

<playground path="ckb/CKBJson/demo/chartdic.jsx"></playground>

## 📖 Documentation

For more usages, please check the [API Reference](https://ava.antv.vision/en/docs/api/ckb/intro)



