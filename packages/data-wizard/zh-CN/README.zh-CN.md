<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> [English](./README.md) | 简体中文


<h1 align="center">
<b>@antv/data-wizard</b>
</h1>

<div align="center">
一个基于 js/ts 的前端数据处理库。


[![Version](https://badgen.net/npm/v/@antv/data-wizard)](https://www.npmjs.com/@antv/data-wizard)
[![NPM downloads](http://img.shields.io/npm/dm/@antv/data-wizard.svg)](http://npmjs.com/@antv/data-wizard)
</div>

DataWizard 的架构如下：

<div align="center">
<img src='https://gw.alipayobjects.com/zos/antfincdn/kP9ZgcHVyn/DataWizard%252520Framework.png' width="320" alt='DataWizard framework' />
</div>

## ✨ 特性

### 数据处理

DataWizard 的数据处理模块 `DataFrame`，支持读取不同类型的一维和二维源数据，将其转换为 `DataFrame` 数据基本流转单元来处理数据。使用 `DataFrame`，你可以从一个数据集样本中获取和切割数据，也可以提取出各个字段的信息。这些信息包括字段的特征（字段名称、数据类型、统计信息等），性质（连续性、离散性等），以及多字段间的字段间关系（相关性、周期性等）。

对于关系型数据（网络数据），DW 通过 `GraphData` 模块进行处理和分析，支持读取点边数据、边数组、树型结构数据。使用 `GraphData`，你可以解析数组、图数据和层次型数据，并提取图中的常用的结构和统计特征，还可以得到标准化为 `DataFrame` 的点表和边表，使用 `DataFrame` 提供的 API 来分析点、边各个字段的统计特征。

简而言之，`DataFrame` 和 `GraphData` 可以帮助你了解一个数据集。这也是我们做数据分析、智能可视化等工作的前提。

<div align="center">
<img src="https://gw.alipayobjects.com/zos/antfincdn/4qbDDKfhu2/DataFrame.gif" width="600" alt="DataFrame demo" />
</div>

### 数学统计

DataWizard 的数学统计模块 `statistics`，支持最大值、最小值、方差、皮尔逊系数、变异系数等常用统计学方法。`DataFrame` 和 `GraphData` 的统计信息计算能力，也是基于 `statitstics` 实现的。

<div align="center">
<img src="https://gw.alipayobjects.com/zos/antfincdn/WLciSdHENb/statistics.gif" width="600" alt="statistics demo" />
</div>

### 数据模拟

DataWizard 的数据模拟模块 `random`，提供了非常丰富的模拟数据生成能力。可用于随机生成多种类型的数据，包括基础数据、文本数据、日期时间数据、颜色数据、Web 数据、位置数据、中文地址数据等。你可以用它来快速开发一些数据模拟或自动填充类的功能。比如蚂蚁集团的设计工程化插件 <img src="https://gw.alipayobjects.com/zos/rmsportal/LFooOLwmxGLsltmUjTAP.svg" width="18"> [Kitchen](https://kitchen.alipay.com/) 中的自动填充功能。

<div align="center">
<img src="https://gw.alipayobjects.com/zos/antfincdn/VopHAgkeMZ/random.gif" width="600" alt="random demo" />
</div>

## 📦 安装

```bash
$ npm install @antv/data-wizard
```

## 🔨 快速开始

### DataFrame

```ts
import { DataFrame } from '@antv/data-wizard';

/* 基本用法 */
const df = new DataFrame([
  { a: 1, b: 4, c: 7 },
  { a: 2, b: 5, c: 8 },
  { a: 3, b: 6, c: 9 },
]);
/*
DataFrame
  {
    axes: [
      [0, 1, 2],
      ['a', 'b', 'c'],
    ],
    data: [
      [1, 4, 7],
      [2, 5, 8],
      [3, 6, 9],
    ],
    colData: [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ],
  }
*/

/** 获取统计信息 */
df.info();
/*
  [
    {
      count: 3,
      distinct: 3,
      type: 'integer',
      recommendation: 'integer',
      missing: 0,
      rawData: [1, 2, 3],
      valueMap: { '1': 1, '2': 1, '3': 1 },
      minimum: 1,
      maximum: 3,
      mean: 2,
      percentile5: 1,
      percentile25: 1,
      percentile50: 2,
      percentile75: 3,
      percentile95: 3,
      sum: 6,
      variance: 0.6666666666666666,
      standardDeviation: 0.816496580927726,
      zeros: 0,
      levelOfMeasurements: ['Interval', 'Discrete'],
      name: 'a',
    },
    {
      count: 3,
      distinct: 3,
      type: 'integer',
      recommendation: 'integer',
      missing: 0,
      rawData: [4, 5, 6],
      valueMap: { '4': 1, '5': 1, '6': 1 },
      minimum: 4,
      maximum: 6,
      mean: 5,
      percentile5: 4,
      percentile25: 4,
      percentile50: 5,
      percentile75: 6,
      percentile95: 6,
      sum: 15,
      variance: 0.6666666666666666,
      standardDeviation: 0.816496580927726,
      zeros: 0,
      levelOfMeasurements: ['Interval', 'Discrete'],
      name: 'b',
    },
    {
      count: 3,
      distinct: 3,
      type: 'integer',
      recommendation: 'integer',
      missing: 0,
      rawData: [7, 8, 9],
      valueMap: { '7': 1, '8': 1, '9': 1 },
      minimum: 7,
      maximum: 9,
      mean: 8,
      percentile5: 7,
      percentile25: 7,
      percentile50: 8,
      percentile75: 9,
      percentile95: 9,
      sum: 24,
      variance: 0.6666666666666666,
      standardDeviation: 0.816496580927726,
      zeros: 0,
      levelOfMeasurements: ['Interval', 'Discrete'],
      name: 'c',
    },
  ]
*/
```

### statistics

```ts
import { statistics as stats } from '@antv/data-wizard';

/** 计算最小值 */
stats.min([1, 2, 3, 201, 999, 4, 5, 10]);
// 1

/** 计算方差 */
stats.variance([1, 2, 3, 201, 999, 4, 5, 10]);
// 106372.359375

/** 计算皮尔逊系数 */
stats.pearson([1, 2, 3, 201, 999, 4, 5, 10], [12, 22, 23, 2201, 2999, 24, 25, 210]);
// 0.8863724626851197
```


### random

```ts
import { random } from '@antv/data-wizard';

const r = new random();

/** 生成布尔值 */
r.boolean();
// true

/** 生成手机号 */
r.phone({asterisk: true});
// '182****8595'

/** 生成日期时间 */
r.datetime();
// '2019-01-23T09:54:06+08:00'

/** 生成颜色 */
r.rgb();
// 'rgb(202,80,38)'

/** 生成 URL */
r.url();
// 'http://alo.tg/vivso'

/** 生成坐标 */
r.coordinates();
// '95.7034666, 80.9377218'

/** 生成中文地址 */
r.address();
// '广东省惠州市龙门县黄河胡同378号'
```

## 📖 文档

更多用法请移步至 API。

* [DataFrame](https://ava.antv.vision/zh/docs/api/data-wizard/data-frame)
* [GraphData](https://ava.antv.vision/zh/docs/api/data-wizard/graph-data)
* [statistics](https://ava.antv.vision/zh/docs/api/data-wizard/statistics)
* [random](https://ava.antv.vision/zh/docs/api/data-wizard/random)

## 📄 许可证

MIT
