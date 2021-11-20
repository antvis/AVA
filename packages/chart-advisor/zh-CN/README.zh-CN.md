<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> [English](./README.md) | 简体中文

<h1 align="center">
  <p>ChartAdvisor</p>
  <span style="font-size: 24px;">AVA/chart-advisor</span>
</h1>

<div align="center">

一个经验驱动的基于 AVA 推荐规则库的约束系统以及图表校验系统进行图表推荐的 js 库。



[![Version](https://badgen.net/npm/v/@antv/chart-advisor)](https://www.npmjs.com/@antv/chart-advisor)
[![NPM downloads](http://img.shields.io/npm/dm/@antv/chart-advisor.svg)](http://npmjs.com/@antv/chart-advisor)
</div>

## ✨ 功能特性

ChartAdvisor 中透出了多个工具类供用户使用，包括 `ChartAdvisor`、`Advisor` 和 `Linter`。


* **Advisor**: 是对应图表推荐的工具类。

* **Linter**: 是对应图表优化的工具类。

`Advisor` 和 `Linter` 分别提供了 `advise()` 和 `lint()` 函数用于图表推荐和优化。

* **ChartAdvisor**: 是一个同时包含图表推荐和图表优化功能的工具类。

`ChartAdvisor` 中同时包含了一个 `Advisor` 和一个 `Linter` 对象，并提供了 `advise()` 函数用于图表推荐和优化，
相对于 `Advisor` 中的同名函数多了一个 `Lint` 类型的输出作为图表优化建议项。

### 图表推荐

通过分析给定的数据集和分析需求，推荐出一个图表配置列表。位于列表首位的是推荐值最高的图表配置。

### 图表优化

给定已有图表配置，根据规则和给定需求发现并优化图表中存在的问题。

## 📦 安装

```bash
$ npm install @antv/chart-advisor
```

## 🔨 使用

### ChartAdvisor 使用

`ChartAdvisor` 类中提供了 `advise()` 方法，用于提供自动图表推荐和优化功能，输入参数为 `AdviseParams`，
输出结果为推荐图表和优化建议，其中必选参数为源数据 `data: any[]`，其他输入输出参数详见 [ChartAdvisor.advise() API](../../api/chart-advisor/chartAdvice)。

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

### Advisor 使用

`Advisor` 类中提供了 `advise()` 方法，用于提供自动图表推荐功能，输入参数为 `AdviseParams`，
输出结果为推荐图表，其中必选参数为源数据 `data: any[]`，其他输入输出参数详见 [Advisor.advise() API](../../api/chart-advisor/advice)。

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

### Linter 使用

`Linter` 类中提供了 `lint()` 方法，用于提供自动图表修复功能，输入参数为 `LintParams`，
输出结果为优化建议，其中必选参数为输入图表语法 `spec: AntVSpec`，其他输入输出参数详见 [Linter.lint() API](../../api/chart-advisor/lint)。

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


## 📖 文档

更多用法请移步至 [官网API](https://ava.antv.vision/zh/docs/api/chart-advisor/ChartAdvisor)


## 贡献

我们欢迎所有的贡献。请先阅读 [贡献指南](../../zh-CN/CONTRIBUTING.zh-CN.md)。

您可以以向我们的官方 Github 提出 [Pull Requests](https://github.com/antvis/AVA/pulls) 或 [GitHub Issues](https://github.com/antvis/AVA/issues) 的形式提交任何想法。
让我们一起创造一个更好的开源智能可视化工具！

## 许可证

MIT
