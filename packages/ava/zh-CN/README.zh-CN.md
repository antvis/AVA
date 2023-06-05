<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18" alt="语言icon" /> 简体中文 | [English](../README.md)

<h1 align="center">
<b>@antv/ava</b>
</h1>

<div align="center">
为了更简便的可视分析而生的技术框架.

[![MIT License](https://img.shields.io/github/license/antvis/ava)](/LICENSE) [![Language](https://img.shields.io/badge/language-typescript-blue.svg)](https://www.typescriptlang.org) [![NPM Package](https://img.shields.io/npm/v/@antv/ava.svg)](https://www.npmjs.com/package/@antv/ava) [![NPM Downloads](http://img.shields.io/npm/dm/@antv/ava.svg)](https://www.npmjs.com/package/@antv/ava) 

</div>

## 简介

[@antv/ava](https://www.npmjs.com/package/@antv/ava) 是 AVA 的核心 JS 包，它包含四个主要模块：

* <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">data (数据处理)</span>：数据处理模块。用于数据集统计分析和处理。
* <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">insight (智能洞察)</span>：自动洞察模块。自动地从多维数据中发现数据洞察。
* <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">ckb (图表知识库)</span>：图表知识库模块。基于经验总结的关于可视化和图表的各种基本知识和观察，它是智能图表推荐的基石。
* <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">advisor (图表推荐和自动生成)</span>：图表推荐模块。基于数据和分析需求来推荐图表类型和具体的图表细节设置，也可对既有的图表进行图表优化。


## 下载

```shell
# npm
$ npm install @antv/ava --save

# yarn
$ yarn add @antv/ava
```

## 使用方式

下面我们结合实际案例了解 [@antv/ava](https://www.npmjs.com/package/@antv/ava) 四个主要模块的使用方式：

```ts
import { DataFrame, getInsights, ckb, Advisor } from '@antv/ava';

// 输入数据
const data = [
  { price: 38, type: 'A' },
  { price: 52, type: 'B' },
  { price: 61, type: 'C' },
  { price: 145, type: 'D' },
  { price: 49, type: 'E' },
];

// 1. 数据预处理模块，分析数据信息
const df = new DataFrame(data);
const dataInfo = df.info();

// 2. 自动洞察模块，从数据中提取洞察
const { insights } = getInsights(data);

// 3. 图表知识库模块
const myCkb = ckb();

// 4. 图表推荐模块
const chartAdvisor = new Advisor();
// 基于输入数据，推荐图表并给出优化建议
const results = chartAdvisor.advise({ data });
```

## 贡献

我们欢迎任何共建。请先阅读 [贡献指南](./CONTRIBUTING.zh-CN.md)。欢迎通过 [pull requests](https://github.com/antvis/AVA/pulls) 或 [GitHub issues](https://github.com/antvis/AVA/issues) 向我们提供你的想法。让我们一起来把 AVA 做得更好！
