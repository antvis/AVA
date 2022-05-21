<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> English | [简体中文](./zh-CN/README.zh-CN.md)


<h1 align="center">
<b>@antv/data-wizard</b>
</h1>

<div align="center">
A js/ts library for data processing and analysis.


[![Version](https://badgen.net/npm/v/@antv/data-wizard)](https://www.npmjs.com/@antv/data-wizard)
[![NPM downloads](http://img.shields.io/npm/dm/@antv/data-wizard.svg)](http://npmjs.com/@antv/data-wizard)
</div>

The framework of DataWizard is as follows:

<div align="center">
<img src='https://gw.alipayobjects.com/zos/antfincdn/kP9ZgcHVyn/DataWizard%252520Framework.png' width="320" alt='DataWizard framework' />
</div>

## ✨ Features

### Data Processing

DataWizard can help you extract information of fields from a dataset sample by its `DataFrame` module. You can get or slice data by it. The information includes the field's characteristics (field name, data type, statistics, etc.) and properties (continuity, discreteness, etc.), as well as field-to-field relationships (correlation, periodicity, etc.).

For relational data (network data), DW processes and analyzes it through the `GraphData` module, which supports reading nodes-links data, links arrays, and hierarchical data. Using `GraphData`, you can parse arrays, graph data and hierarchical data, and extract common-used structural and statistical features. Also, the nodes and edges can be converted to `DataFrame`, and its API to analyze the statistics of each node field and link field.

In short, `DataFrame` and `GraphData` can help you understand and process a dataset. This is the premise of data analysis and Automatic chart recommendation.

<div align="center">
<img src="https://gw.alipayobjects.com/zos/antfincdn/4qbDDKfhu2/DataFrame.gif" width="600" alt="DataFrame demo" />
</div>

### Statistical Methods

The `statistics` module of DataWizard provides common statistical methods, including computing minimum, maximum, variance, Pearson correlation coefficient, etc. The statistical information extracting of `DataFrame` and `GraphData` is also based on `statistics`.

<div align="center">
<img src="https://gw.alipayobjects.com/zos/antfincdn/WLciSdHENb/statistics.gif" width="600" alt="statistics demo" />
</div>

### Data Mocking

The `random` module of DataWizard provides you comprehensive data mocking options. Data types include basic data, text data, datetime data, color data, Web data, location data, Chinese data address, etc.. You can use it to quickly develop some data generating or auto-filling functions. For example, the auto-fill function in the desgin engineering plugin <img src="https://gw.alipayobjects.com/zos/rmsportal/LFooOLwmxGLsltmUjTAP.svg" width="18"> [Kitchen](https://kitchen.alipay.com/).

<div align="center">
<img src="https://gw.alipayobjects.com/zos/antfincdn/VopHAgkeMZ/random.gif" width="600" alt="random demo" />
</div>

## 📦 Installation

```bash
$ npm install @antv/data-wizard
```

## 🔨 Quick Start

### DataFrame

```ts
import { DataFrame } from '@antv/data-wizard';

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
import { statistics as stats } from '@antv/data-wizard';

/** Calculate minimum */
stats.min([1, 2, 3, 201, 999, 4, 5, 10]);
// 1

/** Calculate variance */
stats.variance([1, 2, 3, 201, 999, 4, 5, 10]);
// 106372.359375

/** Calculate Pearson correlation coefficient */
stats.pearson([1, 2, 3, 201, 999, 4, 5, 10], [12, 22, 23, 2201, 2999, 24, 25, 210]);
// 0.8863724626851197
```


### random

```ts
import { random } from '@antv/data-wizard';

const r = new random();

/** Mock boolean */
r.boolean();
// true

/** Mock phone number */
r.phone({asterisk: true});
// '182****8595'

/** Mock datatime */
r.datetime();
// '2019-01-23T09:54:06+08:00'

/** Mock color */
r.rgb();
// 'rgb(202,80,38)'

/** Mock URL */
r.url();
// 'http://alo.tg/vivso'

/** Mock coordinates */
r.coordinates();
// '95.7034666, 80.9377218'

/** Mock Chinese address */
r.address();
// '广东省惠州市龙门县黄河胡同378号'
```

## 📖 Documentation

For more usages, please check the API reference.

* [DataFrame](https://ava.antv.vision/en/docs/api/data-wizard/data-frame)
* [GraphData](https://ava.antv.vision/en/docs/api/data-wizard/graph-data)
* [statistics](https://ava.antv.vision/en/docs/api/data-wizard/statistics)
* [random](https://ava.antv.vision/en/docs/api/data-wizard/random)

</div>

## 📄 License

MIT
