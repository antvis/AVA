<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> [English](./README.md) | 简体中文


<h1 align="center">
<b>@antv/lite-insight</b>
</h1>

<div align="center">
从多维数据中发现洞察的探索性数据分析JavaScript工具库


[![Version](https://badgen.net/npm/v/@antv/lite-insight)](https://www.npmjs.com/@antv/lite-insight)
[![NPM downloads](http://img.shields.io/npm/dm/@antv/lite-insight.svg)](http://npmjs.com/@antv/lite-insight)
</div>


## ✨ 功能特性

* **自动洞察**: 自动检测并突出显示数据中的洞察，以促进数据分析过程中的模式发现。
* **可视化 & 注释**: 直观地向非专业分析人员展示和传达数据中地洞察发现。
* **共性/例外模式**: 挖掘不同数据模式之间存在的共性和差异。

自动洞察的流程如下：

<img src='https://gw.alipayobjects.com/zos/antfincdn/nLmy8%26OiOh/li-pipeline-zh.jpg' alt='LiteInsight pipeline' />

## 📦 安装

```bash
$ npm install @antv/lite-insight
```

## 🔨 快速开始


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

## 📖 文档

更多用法请移步至 [官网API](https://ava.antv.vision/zh/docs/api/lite-insight/auto-insights)

## 🧷 致谢

LiteInsight 其中的一些功能设计受到以下论文的启发：

* [Extracting Top-K Insights from Multi-dimensional Data](https://www.microsoft.com/en-us/research/uploads/prod/2017/02/Insights_SIGMOD17.pdf)


* [MetaInsight: Automatic Discovery of Structured Knowledge for Exploratory Data Analysis](https://www.microsoft.com/en-us/research/uploads/prod/2021/03/rdm337-maA.pdf)

## 📄 许可证

MIT
