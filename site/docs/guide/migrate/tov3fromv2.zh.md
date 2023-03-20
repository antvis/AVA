---
title: 从 v2 升级到 v3
order: 8
---

<embed src='@/docs/common/style.md'></embed>

## 从包到模块

所有 v2 版本中非 React 组件的独立 npm 包都整合到了一个 npm 包 `@antv/ava` 中。原各包的能力整合到总包的各模块中。

* `@antv/ckb` -> `@antv/ava`
* `@antv/data-wizard` -> `@antv/ava`
* `@antv/chart-advisor` -> `@antv/ava`
* `@antv/lite-insight` -> `@antv/ava`
* `@antv/smart-board` -> 不再推荐使用

### CKB

#### CKBJson

对 CKB 的调用方法进行了简化。

API:

```js
// v2
CKBJson(lang, completed)

// v3
ckb(ckbCfg?)
```

原先提供的语言选择参数 `lang` 是为了方便用户直接使用 CKB 制作图表知识类页面时可以方便地整体切换语言。但是考虑到这类需求不多，v3 直接去掉了这个参数，并提供了替代方案：另一个专门获取翻译对照表的 API [`ckbDict(lang?)`](../../api/ckb/ckbDict)。 对于有非英语需求的 CKB 使用场景，可以按需自行定制翻译。也欢迎对 CKB 的多语言、词典进行贡献！

原先提供的 `completed` 参数是用来剔除 CKB 中未完善的图表类型。考虑到既然图表类型不完善，就干脆不透出了。欢迎对 CKB 的标准图表类型进行贡献！

遵从更严格的命名规范，将 API 名称改成小写。

原先对于 CKB 的定制能力被集成到这个 API 中来了。`ckbCfg` 参数中可以配置 `exclude`/`include`/`custom` 三种针对图表类型的自定义方式。

#### CKBOptions

`CKBOptions` 方法正式弃用。改为直接使用 CKB 提供的[常量](../../api/ckb/constants)。

API:

```js
// v2
import { CKBOptions } from '@antv/ckb';
CKBOptions().family

// v3
import { FAMILIES } from '@antv/ava'
```

#### addChart

`addChart` 方法正式弃用。改为使用 `ckb` 并通过 `ckbCfg.custom` 参数属性来添加自定义图表。

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
// v2 
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
在 v2 版本中，ChartAdvisor 类中的 adviseWithLog 集成了 advise 和 lint 两个能力，
因此 lintWithLog 的功能实际被包含在 adviseWithLog 中。
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


### insight

#### getDataInsights

`getDataInsights` 方法更名为 `getInsights`

API:

```js
//v2
getDataInsights(data, options);

//v3
getInsights(data, options);

```

#### InsightOptions

可选配置`options`的类型`InsightOptions`改动如下：


| 属性 | 类型 | v2 | v3 |
| ----| ---- | ---- | -----|
| dimensions | `Dimensions[]` | ['year'] | [{`fieldName`: 'year'}] |
| measure | `Measure[]` | [{`field`: 'life_expect', method: 'MEAN'}] | [{`fieldName`: 'life_expect', method: 'MEAN' }] |
| visualization |  `boolean \| VisualizationOptions` | false \| {`summaryType`: 'text \| 'spec} | false \| {`lang`: 'en-US' \| 'zh-CN' } |

示例：

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

输出的洞察信息`homogeneousInsights`的类型 `HomogeneousInsightInfo`部分属性名改动如下：

| v2属性名 | v3属性名 |
| ----| ---- |
| commSet | commonSet |
| exc | exceptions | 