---
title: Introduction to ChartAdvisor
order: 0
---

<embed src='@/docs/common/style.md'></embed>

Recommend and automatically generate chart configurations based on data and analytics requirements.

## ✨ Features

Advisor class contains several tool functions including `Advise()` , `adviseWithLog()` , `Lint()` and `lintWithLog()`.
* **Advise()**: is the tool function for recommending charts automatically.

* **Lint()**: is the tool function for providing chart optimization suggestions.

* **adviseWithLog()**: is corresponding to `Advise()` function，which is used to getting the recommendation log to explain the logic.

* **lintWithLog()**: is corresponding to `Lint()` function，which is used to getting the optimizing log to explain the logic.

## 📦 Installation

```bash
$ npm install @antv/ava
```

## 🔨 Usage

### Advise() Usage

The `Advisor` class provides the `advise()` method, 
which aimed to provide automatic chart recommendation ability.
Its input parameter is `AdviseParams` and its output is the recommended charts, 
where the required input is the source data `data: any[]` and 
detailed input and output parameters are described in the [Advisor.advise() API](../../api/advice/Advisor.en.md).

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

### Lint() Usage

The `Advisor` class provides the `Lint()` method, 
which can provide automatic chart optimization suggestions.
Its input parameter is `LintParams` and its output is the recommended optimization suggestions, 
where the required input is  the input chart schema `spec: AntVSpec` and 
detailed input and output parameters are described in the [Advisor.linter() API](../../api/advice/Advisor-lint.en.md)

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


### Joint Usage of Advise() and Lint() 

`Spec` in the return value of  `advise()` function is the input params of `lint()` functions.

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

## 📖 Documentation

For more usages, please check the [API Reference](../../api/advice/Advisor.en.md)



