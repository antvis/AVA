<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> English | [简体中文](./zh-CN/README.zh-CN.md)

<h1 align="center">
  <p>ChartAdvisor</p>
  <span style="font-size: 24px;">AVA/chart-advisor</span>
</h1>

<div align="center">

A js library for empiric-driven chart recommendation based on visualization rules and chart linter of `AVA`.



[![Version](https://badgen.net/npm/v/@antv/chart-advisor)](https://www.npmjs.com/@antv/chart-advisor)
[![NPM downloads](http://img.shields.io/npm/dm/@antv/chart-advisor.svg)](http://npmjs.com/@antv/chart-advisor)
</div>

## ✨ Features

ChartAdvisor contains several tool classes exported for users, including `ChartAdvisor`, `Advisor` and `Linter`.

* **Advisor**: is the tool classes for recommending charts automatically.

* **Linter**: is the tool classes for providing chart optimization suggestions.

`Advisor` and `Linter` provide `advise()` and `lint()` functions for chart recommendation and optimization, respectively.

* **ChartAdvisor**: is a tool class that contains both chart recommendation and chart optimization abilities.

`ChartAdvisor` contains both an `Advisor` and a `Linter` object, and provides `advise()` function,
compared to `Advisor`, it provides an additional `Lint` object as output for providing chart suggestions.

### Chart Recommendation

A list of chart configurations is recommended by analyzing the given dataset and analysis requirements.
The chart configuration with the highest recommendation is at the top of the list.

### Chart Optimization

Given an existing chart configuration, find and optimize problems in the chart based on rules and given requirements.
The problem with the highest error score is at the top of the list.

## 📦 Installation

```bash
$ npm install @antv/chart-advisor
```

## 🔨 Usage

### ChartAdvisor Usage

The `ChartAdvisor` class provides the `advise()` method, 
which can provide automatic chart recommendation and optimization abilities.
Its input parameter is `AdviseParams` and its output is the recommended charts and corresponding optimization suggestions, 
where the required input is the source data `data: any[]` and 
detailed input and output parameters are described in the [ChartAdvisor.advise() API](../../api/chart-advisor/1_ChartAdvisor-advise)

```js
import { Advisor, Linter, ChartAdvisor } from '@antv/chart-advisor';

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];

const myChartAdvisor = new ChartAdvisor();

const results = myChartAdvisor.advise({ data }),
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
//     "lint": [...]
// }]

// recommend charts
const myAdvisor = new Advisor();
const advices = myAdvisor.advise({data, fields: ['price', 'type'], options: { refine: true }});

// find problems in a chart
const myLinter = new Linter();
const errors = myLt.lint(spec);
```

### Advisor Usage

The `Advisor` class provides the `advise()` method, 
which aimed to provide automatic chart recommendation ability.
Its input parameter is `AdviseParams` and its output is the recommended charts, 
where the required input is the source data `data: any[]` and 
detailed input and output parameters are described in the [Advisor.advise() API](../../api/chart-advisor/advice).

```js
import { Advisor } from '@antv/chart-advisor';

const data = [
  { year: '2007', sales: 28 },
  { year: '2008', sales: 55 },
  { year: '2009', sales: 43 },
  { year: '2010', sales: 91 },
  { year: '2011', sales: 81 },
  { year: '2012', sales: 53 },
  { year: '2013', sales: 19 },
  { year: '2014', sales: 87 },
  { year: '2015', sales: 52 },
];

const myAdvisor = new Advisor();

const advices = myAdvisor.advise({ data });
// [{
//     "type": "line_chart",
//     "spec": {
//         "basis": {
//             "type": "chart"
//         },
//         "data": {...},
//         "layer": [...]
//     },
//     "score": 2
// }]
```

### Linter Usage

The `Linter` class provides the `Linter()` method, 
which can provide automatic chart optimization suggestions.
Its input parameter is `LintParams` and its output is the recommended optimization suggestions, 
where the required input is  the input chart schema `spec: AntVSpec` and 
detailed input and output parameters are described in the [Linter.Linter() API](../../api/chart-advisor/lint)

```js
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

## 📖 Documentation

For more usages, please check the [API Reference](https://ava.antv.vision/en/docs/api/chart-advisor/ChartAdvisor)

## Contribution

We welcome all contributions. Please read [General Contribution Guide](../../CONTRIBUTING.md) first.

You can submit any ideas as [Pull Requests](https://github.com/antvis/AVA/pulls) or as [GitHub Issues](https://github.com/antvis/AVA/issues). 
Let's build a better AVA together.

## License

MIT
