---
title: Introduction to data
order: 0
---

<embed src='@/docs/common/style.md'></embed>


`data` is a module for data processing. In the AVA framework, it is used to understand and process the input dataset.

## ✨ Features

### Data Processing

`data` can help you extract information of fields from a dataset sample by its `DataFrame` module. You can get or slice data by it. The information includes the field's characteristics (field name, data type, statistics, etc.) and properties (continuity, discreteness, etc.), as well as field-to-field relationships (correlation, periodicity, etc.).

In short, `DataFrame` can help you understand and process a dataset. This is the premise of data analysis and Automatic chart recommendation.

<div align="center">
<img src="https://gw.alipayobjects.com/zos/antfincdn/4qbDDKfhu2/DataFrame.gif" width="600" alt="DataFrame demo" />
</div>

### Statistical Methods

The `statistics` module of `data` provides common statistical methods, including computing minimum, maximum, variance, Pearson correlation coefficient, etc. The statistical information extracting of `DataFrame` is also based on `statistics`.

<div align="center">
<img src="https://gw.alipayobjects.com/zos/antfincdn/WLciSdHENb/statistics.gif" width="600" alt="statistics demo" />
</div>

## 🔨 Usage

### DataFrame

```ts
import { DataFrame } from '@antv/ava';

/* Basic usage */
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

/** Get statistical information */
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
import { min, variance, pearson } from '@antv/ava';

/** Calculate minimum */
min([1, 2, 3, 201, 999, 4, 5, 10]);
// 1

/** Calculate variance */
variance([1, 2, 3, 201, 999, 4, 5, 10]);
// 106372.359375

/** Calculate Pearson correlation coefficient */
pearson([1, 2, 3, 201, 999, 4, 5, 10], [12, 22, 23, 2201, 2999, 24, 25, 210]);
// 0.8863724626851197
```

## 📖 Documentation

For more usages, please check the API reference.

* [DataFrame](../../api/data/data-frame)
* [statistics](../../api/data/statistics)

