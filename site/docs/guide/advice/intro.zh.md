---
title: Advisor 简介
order: 0
---

<embed src='@/docs/common/style.md'></embed>


基于数据和分析需求来推荐和自动生成图表配置。

## ✨ 功能特性

提供了一个 Advisor 工具类，其中透出了多个方法供用户使用，包括 `Advise()` 、`adviseWithLog()` 、 `Lint()` 和 `lintWithLog()`。

* **Advise()**: 是对应图表推荐的方法。通过分析给定的数据集和分析需求，推荐出一个图表配置列表。位于列表首位的是推荐值最高的图表配置。

* **Lint()**: 是对应图表优化的方法。给定已有图表配置，根据规则和给定需求发现并优化图表中存在的问题。

* **adviseWithLog()**: 与 `Advise()` 方法对应，用于获取图表推荐的 log 记录，以解释 图表推荐结果 的获取逻辑。

* **lintWithLog()**: 与 `Lint()` 方法对应，用于获取图表优化的 log 记录，以解释 图表优化结果 的获取逻辑。

## 📦 安装

```bash
$ npm install @antv/ava
```

## 🔨 使用
声明 Advisor 对象后， 可以独立分别调用 `Advise()` 和 `Lint()` 两个方法，也可以搭配使用。

### Advise() 使用

`Advisor` 类中提供了 `advise()` 方法，用于提供自动图表推荐和优化功能，输入参数为 `AdviseParams`，
输出结果为推荐图表和优化建议，其中必选参数为源数据 `data: any[]`，其他输入输出参数详见 [Advisor.advise() API](../../api/advice/Advisor.zh.md)。

```js
import { Advisor } from '@antv/ava';

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];

const myChartAdvisor = new Advisor();

const adviseResults = myChartAdvisor.advise({ data })；

return adviseResults;
// example of adviseResults:
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

### Lint() 使用

`Advisor` 类中提供了 `lint()` 方法，用于提供自动图表修复功能，输入参数为 `LintParams`，
输出结果为优化建议，其中必选参数为输入图表语法 `spec: AntVSpec`，其他输入输出参数详见 [Advisor.lint() API](../../api/advice/Advisor-lint.zh.md)。

```js
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

const myChartAdvisor = new Advisor();

const problems = myChartAdvisor.lint({ spec });

return problems;
// example of problems;:
// [{
//     "type": "SOFT",
//     "id": "diff-pie-sector",
//     "score": 0.3752209678037489,
//     "docs": {
//         "lintText": "Difference should be big enough for pie sectors."
//     }
// }]
```


### Advise() 与 Lint() 搭配使用

`advise()` 返回值 `advices: Advice[]` 中每一项 `advice: Advice` 中的 `spec` 是 `lint()` 方法的入参，用下面的串联方式，可将图表推荐得到的结果再优化一遍。

```js
import { Advisor } from '@antv/ava';

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];

const myChartAdvisor = new Advisor();

const adviseResults = myChartAdvisor.advise({ data })；

const lintedResults = adviseResults.map((advice) => {
  const linter = myChartAdvisor.lint(advice.spec);
  return {...advice, lint: linter};
});

return lintedResults;
// example of lintedResults:
// {
//   "type": "pie_chart",
//   "spec": {
//     "basis": {
//       "type": "chart"
//     },
//     "data": {
//       "type": "json-array",
//       "values": [
//         {
//           "price": 100,
//           "type": "A"
//         },
//         {
//           "price": 120,
//           "type": "B"
//         },
//         {
//           "price": 150,
//           "type": "C"
//         }
//       ]
//     },
//     "layer": [
//       {
//         "mark": {
//           "type": "arc"
//         },
//         "encoding": {
//           "theta": {
//             "field": "price",
//             "type": "quantitative"
//           },
//           "color": {
//             "field": "type",
//             "type": "nominal"
//           }
//         }
//       }
//     ]
//   },
//   "score": 1.5535986680617797,
//   "lint": [
//     {
//       "type": "SOFT",
//       "id": "diff-pie-sector",
//       "score": 0.0405306694568926,
//       "docs": {
//         "lintText": "The difference between sectors of a pie chart should be large enough."
//       }
//     },
//     {
//       "type": "SOFT",
//       "id": "series-qty-limit",
//       "score": 0.6666666666666666,
//       "docs": {
//         "lintText": "Some charts should has at most N values for the series."
//       }
//     }
//   ]
// }
```

## 📖 文档

更多用法请移步至 [官网API](../../api/advice/Advisor.zh.md)



