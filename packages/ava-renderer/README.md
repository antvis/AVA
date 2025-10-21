<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> English | [简体中文](./zh-CN/README.zh-CN.md)


<h1 align="center">
<b>@antv/ava</b>
</h1>

<div align="center">
A framework for automated visual analytics.

[![MIT License](https://img.shields.io/github/license/antvis/ava)](/LICENSE) [![Language](https://img.shields.io/badge/language-typescript-blue.svg)](https://www.typescriptlang.org) [![NPM Package](https://img.shields.io/npm/v/@antv/ava.svg)](https://www.npmjs.com/package/@antv/ava) [![NPM Downloads](http://img.shields.io/npm/dm/@antv/ava.svg)](https://www.npmjs.com/package/@antv/ava) 

</div>

## Introduction

[@antv/ava](https://www.npmjs.com/package/@antv/ava) is the core JS package of AVA, which contains four main modules:

* <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">data (Data Processing)</span>: Data Processing Module. Used for statistical analysis and processing of datasets.
* <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">insight (Auto Insight)</span>: Automatic Insights Module. Automatically discover data insights from multi-dimensional data.
* <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">ckb (Chart Knowledge Base)</span>: Chart Knowledge Base Module. Based on empirically derived knowledge and observations about the various fundamentals of visualization and charts, it is the cornerstone of intelligent chart recommendations.
* <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">advisor (Chart Recommendation)</span>: Chart Recommendation Module. Recommend chart types and specific chart detail settings based on data and analysis needs, as well as chart optimization for existing charts.

## Installation and Usage

Installation can be done via npm or the yarn package manager.

```shell
# npm
$ npm install @antv/ava --save

# yarn
$ yarn add @antv/ava
```

The following is a practical example of how the four main modules of [@antv/ava](https://www.npmjs.com/package/@antv/ava) can be used:

```ts
import { DataFrame, getInsights, ckb, Advisor } from '@antv/ava';

// input data
const data = [
  { price: 38, type: 'A' },
  { price: 52, type: 'B' },
  { price: 61, type: 'C' },
  { price: 145, type: 'D' },
  { price: 49, type: 'E' },
];

// 1. Data Processing Module
const df = new DataFrame(data);
const dataInfo = df.info();

// 2. Automatic Insights Module
const { insights } = getInsights(data);

// 3. Chart Knowledge Base Module
const myCkb = ckb();

// 4. Chart Advisor
const chartAdvisor = new Advisor();
// recommend charts and give optimization suggestions based on input data
const results = chartAdvisor.advise({ data });
```

For more examples, please refer to: [AVA Site](https://ava.antv.antgroup.com/examples)

## Contribution [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

We welcome all contributions. Please read our [Contributing Guide](./CONTRIBUTING.md) first. You can submit any ideas as [pull requests](https://github.com/antvis/AVA/pulls) or as [GitHub issues](https://github.com/antvis/AVA/issues). Let's build a better AVA together.

More at [Wiki: Development](https://github.com/antvis/AVA/wiki/Development).
