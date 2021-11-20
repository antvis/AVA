<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> English | [简体中文](./README.zh-CN.md)


<h1 align="center">
<b>@antv/lite-insight</b>
</h1>

<div align="center">
An EDA (Exploratory Data Analysis) tool in javascript that allows you to take insights from the data.


[![Version](https://badgen.net/npm/v/@antv/lite-insight)](https://www.npmjs.com/@antv/lite-insight)
[![NPM downloads](http://img.shields.io/npm/dm/@antv/lite-insight.svg)](http://npmjs.com/@antv/lite-insight)
</div>


## ✨ Features

* **Auto-Insights**: Automatically detect and highlight the insights to facilitate pattern discovery about the data.
* **Visualization & Annotation**: Clearly represent and convey insights to non-expert users.
* **Homogeneous Data Patterns**: Extract the relations between different patterns.

The pipeline of Auto-Insights:

<img src='https://gw.alipayobjects.com/zos/antfincdn/qtmrmqJKH%26/li-pipeline-en.jpg' alt='LiteInsight pipeline' />

## 📦 Installation

```bash
$ npm install @antv/lite-insight
```

## 🔨 Getting Started


```ts
import { getDataInsights } from '@antv/lite-insight';

getDataInsights(data, {
  limit: 30,
  measures: [
    { field: 'life_expect', method: 'MEAN' },
    { field: 'pop', method: 'SUM' },
    { field: 'fertility', method: 'MEAN' },
  ]
});
```

## 📖 Documentation

For more usages, please check the [API Reference](https://ava.antv.vision/en/docs/api/lite-insight/auto-insights)

## Acknowledgement

Some functionalities of LiteInsight are inspired by the following works.

* [Extracting Top-K Insights from Multi-dimensional Data](https://www.microsoft.com/en-us/research/uploads/prod/2017/02/Insights_SIGMOD17.pdf)


* [MetaInsight: Automatic Discovery of Structured Knowledge for Exploratory Data Analysis](https://www.microsoft.com/en-us/research/uploads/prod/2021/03/rdm337-maA.pdf)


## 📄 License

MIT
