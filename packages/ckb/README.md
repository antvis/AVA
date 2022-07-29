<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> English | [简体中文](./zh-CN/README.zh-CN.md)

<h1 align="center">
  <p>Chart Knowledge Base (CKB)</p>
  <span style="font-size: 24px;">AVA/knowledge</span>
</h1>

<div align="center">

A knowledge base stores the wiki for every type of visualization.

[![Version](https://badgen.net/npm/v/@antv/ckb)](https://www.npmjs.com/@antv/ckb)
[![NPM downloads](http://img.shields.io/npm/dm/@antv/ckb.svg)](http://npmjs.com/@antv/ckb)

</div>

Chart Knowledge Base (CKB) is a library offers knowledge base for chart wikis in a JSON format. The JSON is like this:

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

## Features

### Consistency for Chart Taxonomy

The contribution of the whole data visualization community makes this library a standard. You don't have to struggle with different names or alias or definition of a same chart type.

### To Build Chart Dictionaries in Seconds

With AVA/CKB, you can quickly build your chart dictionary product like this: <img src="https://gw.alipayobjects.com/zos/antfincdn/1yMwFkBvyV/chartcube-logo-cube.svg" width="18"> [ChartCube](https://chartcube.alipay.com/guide)

<div align="center">
<img src="https://gw.alipayobjects.com/zos/antfincdn/%24lJREleYKL/Screen%252520Shot%2525202020-02-14%252520at%2525206.41.07%252520PM.png" width="600" />
</div>

### The Base for Automatic Chart Recommendation

You can easily build a chart type recommendation system with this knowledge base and your customized rules.

## Installation

```bash
$ npm install @antv/ckb
```

## Usage

```js
import { CKBJson } from '@antv/ckb';


// Knowledage base for all charts in English.
const knowledgeBase = CKBJson();

// Knowledage base for completed charts in Chinese.
const zhCompletedKB = CKBJson('zh-CN', true);
```

## Documentation

* For more usages, please check the [Quick API](./API.md)
```js
// ../../docs/api/knowledge.md does not exist
```
* Detailed [API Reference](../../docs/api/knowledge.md)
* [User Guide](./USERGUIDE.md)

## Contribution

We welcome all contributions. Please read [General Contribution Guide](../../CONTRIBUTING.md) and [Contribution Guide for AVA/CKB](./CONTRIBUTING.md) first.

You can submit any ideas as [pull requests](https://github.com/antvis/AVA/pulls) or as [GitHub issues](https://github.com/antvis/AVA/issues). Let's build a better AVA together.

## License

MIT

## Links

<img src="https://gw.alipayobjects.com/zos/antfincdn/1yMwFkBvyV/chartcube-logo-cube.svg" width="18"> [ChartCube](https://chartcube.alipay.com/) - Online chart making tool based on G2Plot.
