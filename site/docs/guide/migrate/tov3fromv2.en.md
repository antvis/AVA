---
title: To v3 from v2
order: 8
---

<embed src='@/docs/common/style.md'></embed>

## From packages to modules

All separate non-React npm packages in v2 have been integrated into one npm package `@antv/ava`. The capabilities of the original packages have been integrated into the modules of this general package.

* `@antv/ckb` -> `@antv/ava`
* `@antv/data-wizard` -> `@antv/ava`
* `@antv/chart-advisor` -> `@antv/ava`
* `@antv/lite-insight` -> `@antv/ava`
* `@antv/smart-board` -> Not recommended for further use

### CKB

#### CKBJson

The API of getting CKB object has been simplified.

API:

```js
// v2
CKBJson(lang, completed)

// v3
ckb(ckbCfg?)
```

The language selection parameter `lang` was originally provided to make it easier for users to switch between languages when creating wiki-like pages using CKB. However, in view of the small number of such requirements, v3 removes this parameter and provides an alternative: an API [`ckbDict(lang?)`](../../api/ckb/ckbDict) which is dedicated to obtaining translation cross-references. For CKB usage scenarios with non-English requirements, you can customize your own translations on demand. Contributions to CKB's multilingual/dictionary are also welcome!

The `completed` parameter was originally supplied to exclude imperfect chart types from the CKB. Considering that the chart types are not perfect/complete, they are simply omitted. Contributions to the CKB standard chart types are welcome!

Comply with the stricter naming convention by changing the API name to lower case.

The original customization capabilities for CKB have been integrated into this API. The `ckbCfg` parameter can be configured with `exclude`/ `include`/ `custom` to customize CKB.

#### CKBOptions

The `CKBOptions` API is officially deprecated. Instead, v3 uses [constants](../../api/ckb/constants) provided by CKB directly.

API:

```js
// v2
import { CKBOptions } from '@antv/ckb';
CKBOptions().family

// v3
import { FAMILIES } from '@antv/ava'
```

#### addChart

The `addChart` API is officially deprecated. Instead, custom charts are added using `ckb` API with the `ckbCfg.custom` parameter property.

API:

```js
// v2
addChart(
  neo_diagram,
  { 'zh-CN': neo_diagram_trans }
);

// v3
const myCkb = ckb({
  custom: {
    neo_diagram: neoDiagram,
  },
});
```


### Advisor

#### Advisor.advise()

```js
// v2
import { Advisor, Linter, ChartAdvisor } from '@antv/chart-advisor';

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];

const myChartAdvisor = new ChartAdvisor();

const results = myChartAdvisor.advise({ data });
// [{
//     "type": "pie_chart",
//     "spec": {
//         "basis": {
//             "type": "chart"
//         },
//         "data": {...},
//         "layer": [...]
//     },
//     "score": 1.5535986680617797,
// }]
```

```js
// v3
import { Advisor } from '@antv/ava';

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];
const myAdvisor = new Advisor();
const advices = myAdvisor.advise({ data });
// [{
//     "type": "pie_chart",
//     "spec": {
//         "basis": {
//             "type": "chart"
//         },
//         "data": {...},
//         "layer": [...]
//     },
//     "score": 1.5535986680617797,
// }]
```

#### Advisor.adviseWithLog()

```js
// v2 doesn't support this function
```

```js
// v3
import { Advisor } from '@antv/ava';

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];
const myAdvisor = new Advisor();
const adviseResult = myAdvisor.adviseWithLog({ data });
// {
//         advices: [
//           { type: 'pie_chart', spec: [Object], score: 0.9186951743562324 },
//           { type: 'donut_chart', spec: [Object], score: 0.9186951743562324 },
//           { type: 'column_chart', spec: [Object], score: 0.5 },
//           { type: 'bar_chart', spec: [Object], score: 0.5 }
//         ],
//         log: [
//           { chartType: 'line_chart', score: 0, log: [Array] },
//           { chartType: 'step_line_chart', score: 0, log: [Array] },
//           { chartType: 'area_chart', score: 0, log: [Array] },
//           { chartType: 'stacked_area_chart', score: 0, log: [Array] },
//            ...
//            ...
//         ]
//       }
```


#### Advisor.lint()

```js
// v2
import { Linter } from '@antv/chart-advisor';

const spec = {
  basis: {
    type: 'chart',
  },
  data: {
    type: 'json-array',
    values: [...],
  },
  layer: [...],
};

const myLinter = new Linter();

const problems = myLinter.lint({ spec })
// [{
//     "type": "SOFT",
//     "id": "diff-pie-sector",
//     "score": 0.3752209678037489,
//     "docs": {
//         "lintText": "Difference should be big enough for pie sectors."
//     }
// }]
```

```js
// v3
import { Advisor } from '@antv/ava';

const spec = {
  basis: {
    type: 'chart',
  },
  data: {
    type: 'json-array',
    values: [...],
  },
  layer: [...],
};

const myAdvisor = new Advisor();

const problems = myAdvisor.lint({ spec });
// [{
//     "type": "SOFT",
//     "id": "diff-pie-sector",
//     "score": 0.3752209678037489,
//     "docs": {
//         "lintText": "Difference should be big enough for pie sectors."
//     }
// }]
```

#### Advisor.lintWithLog()

```js
/* v2 
In v2,  adviseWithLog method in ChartAdvisor Class has integrated both advise and lint.
Therefore, lintWithLog in V2 could be used as adviseWithLog.
*/
import { Advisor, Linter, ChartAdvisor } from '@antv/chart-advisor';

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];

const myChartAdvisor = new ChartAdvisor();

const results = myChartAdvisor.adviseWithLog({ data });
```

```js
// v3
import { Advisor } from '@antv/ava';

const spec = {
  basis: {
    type: 'chart',
  },
  data: {
    type: 'json-array',
    values: [...],
  },
  layer: [...],
};

const myAdvisor = new Advisor();

const problems = myAdvisor.lintWithLog({ spec });
```

### data

#### DataFrame

The `DataFrame` is directly exported from `@antv/ava`, and the usage has not changed.

API:

```js
// v2
import { DataFrame } from '@antv/data-wizard';

const df = new DataFrame([{ a: 1, b: 4 }, { a: 2, b: 5 }]);
const infos = df.info();

// v3
import { DataFrame } from '@antv/ava'

const df = new DataFrame([{ a: 1, b: 4 }, { a: 2, b: 5 }]);
const infos = df.info();
```

#### statistics
The methods in `statistics` are directly exported from `@antv/ava`, and the namespace is no longer provided.

```js
// v2
import { statistics as stats } from '@antv/ava';

/** Calculate minimum */
stats.min([1, 2, 3, 201, 999, 4, 5, 10]);
// 1

/** Calculate variance */
stats.variance([1, 2, 3, 201, 999, 4, 5, 10]);
// 106372.359375

/** Calculate Pearson correlation coefficient */
stats.pearson([1, 2, 3, 201, 999, 4, 5, 10], [12, 22, 23, 2201, 2999, 24, 25, 210]);
// 0.8863724626851197

// v3
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

#### random
`random` is deprecated.

### insight

#### getDataInsights

`getDataInsights` method renamed to `getInsights`

API:

```js
//v2
getDataInsights(data, options);

//v3
getInsights(data, options);

```

#### InsightOptions

The type `InsightOptions` of the optional configuration `options` is changed as follows:

| Properties | Type | v2 | v3 |
| ----| ---- | ---- | -----|
| dimensions | `Dimensions[]` | ['year'] | [{`fieldName`: 'year'}] |
| measure | `Measure[]` | [{`field`: 'life_expect', method: 'MEAN'}] | [{`fieldName`: 'life_expect', method: 'MEAN' }] |
| visualization |  `boolean \| InsightVisualizationOptions` | false \| {`summaryType`: 'text \| 'spec} | false \| {`lang`: 'en-US' \| 'zh-CN' } |

example:

```js
//v2
getDataInsights(data, {
  limit: 30,
  dimensions: ['year'],
  measures: [
    { field: 'life_expect', method: 'MEAN' },
    { field: 'pop', method: 'SUM' },
    { field: 'fertility', method: 'MEAN' },
  ]
});

//v3
getInsights(data, {
  limit: 30,
  dimensions: [{ fieldName: 'year' }],
  measures: [
    { fieldName: 'life_expect', method: 'MEAN' },
    { fieldName: 'pop', method: 'SUM' },
    { fieldName: 'fertility', method: 'MEAN' },
  ]
});

```

#### HomogeneousInsightInfo

V3 modified some property names of `homogeneousInsights`.

| v2 Property | v3 Property |
| ----| ---- |
| commSet | commonSet |
| exc | exceptions | 
