<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18" alt="语言icon" /> 简体中文 | [English](../README.md)

<h1 align="center">
<b>@antv/ava</b>
</h1>

<div align="center">
A framework for automated visual analytics.

[![MIT License](https://img.shields.io/github/license/antvis/ava)](/LICENSE) [![Language](https://img.shields.io/badge/language-typescript-blue.svg)](https://www.typescriptlang.org) [![NPM Package](https://img.shields.io/npm/v/@antv/ava.svg)](https://www.npmjs.com/package/@antv/ava) [![NPM Downloads](http://img.shields.io/npm/dm/@antv/ava.svg)](https://www.npmjs.com/package/@antv/ava) 

</div>

## 下载

```shell
# npm
$ npm install @antv/ava --save

# yarn
$ yarn add @antv/ava
```

## 使用方式

```ts
import { Advisor, ckb, DataFrame, getInsights } from '@antv/ava';

// Chart Advisor and Linter
const data = [
  { price: 38, type: 'A' },
  { price: 52, type: 'B' },
  { price: 61, type: 'C' },
  { price: 145, type: 'D' },
  { price: 49, type: 'E' },
];
const chartAdvisor = new Advisor();
const results = chartAdvisor.advise({ data });

// Chart Knowledge Base
const myCkb = ckb();

// Data Processing and Analysis
const df = new DataFrame(data);
const dataInfo = df.info();

// Data Insight
const { insights } = getInsights(data);
```

## 贡献

Pull requests and stars are highly welcome.

For bugs and feature requests, please [create an issue](https://github.com/antvis/ava/issues/new).
