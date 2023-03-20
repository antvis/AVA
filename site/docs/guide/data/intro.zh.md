---
title: data 简介
order: 0
---

<embed src='@/docs/common/style.md'></embed>


`data` 是一个前端数据处理模块。在 AVA 的框架中，它被用来理解和处理输入端的数据集。

## ✨ 功能特性

### 数据处理

`data` 的数据处理模块 `DataFrame`，支持读取不同类型的一维和二维源数据，将其转换为 `DataFrame` 数据基本流转单元来处理数据。使用 `DataFrame`，你可以从一个数据集样本中获取和切割数据，也可以提取出各个字段的信息。这些信息包括字段的特征（字段名称、数据类型、统计信息等），性质（连续性、离散性等），以及多字段间的字段间关系（相关性、周期性等）。

简而言之，`DataFrame` 可以帮助你了解一个数据集。这也是我们做数据分析、智能可视化等工作的前提。

<div align="center">
<img src="https://gw.alipayobjects.com/zos/antfincdn/4qbDDKfhu2/DataFrame.gif" width="600" alt="DataFrame demo" />
</div>

### 数学统计

`data` 的数学统计模块 `statistics`，支持最大值、最小值、方差、皮尔逊系数、变异系数等常用统计学方法。`DataFrame` 的统计信息计算能力，也是基于 `statitstics` 实现的。

<div align="center">
<img src="https://gw.alipayobjects.com/zos/antfincdn/WLciSdHENb/statistics.gif" width="600" alt="statistics demo" />
</div>

## 🔨 使用

### DataFrame

```ts
import { DataFrame } from '@antv/ava';

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
import { statistics as stats } from '@antv/ava';

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

## 📖 文档

更多用法请移步至 API。
* [DataFrame](../../api/data/data-frame)
* [statistics](../../api/data/statistics)
