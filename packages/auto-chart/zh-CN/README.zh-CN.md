<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> [English](../README.md) | 简体中文

<h1 align="center">
  <p>AutoChart</p>
  <span style="font-size: 24px;">AVA/auto-chart</span>
</h1>

<div align="center">

AutoChart 是一个可以根据数据自动推荐合适的图表并渲染的 React 组件。



[![Version](https://badgen.net/npm/v/@antv/auto-chart)](https://www.npmjs.com/@antv/auto-chart)
[![NPM downloads](http://img.shields.io/npm/dm/@antv/auto-chart.svg)](http://npmjs.com/@antv/auto-chart)
</div>

## ✨ 功能特性

AutoChart 中透出了 `AutoChart` 组件供用户使用。
它结合了 AVA 中的图表推荐库 `ChartAdvisor` 的核心能力。

AutoChart 可以到做到基于给定数据和分析需求来自动生成并渲染合适的图表，
我们推出 AutoChart 的核心目的就是为用户提供一行代码实现智能可视化的能力。


## 📦 安装

```bash
$ npm install @antv/auto-chart
```

## 🔨 使用


```js
import React from 'react';
import ReactDOM from 'react-dom';
import { AutoChart } from '@antv/auto-chart';

const data = [
  { f1: '2019-01', f2: 100 },
  { f1: '2019-02', f2: 300 },
  { f1: '2019-03', f2: 340 },
  { f1: '2019-04', f2: 330 },
];

ReactDOM.render(<AutoChart data={data} />, document.getElementById('container'));
```


## 📖 文档

更多用法请移步至 [官网API](https://ava.antv.vision/zh/docs/api/auto-chart/AutoChart)


## 贡献

我们欢迎所有的贡献。请先阅读 [贡献指南](../../zh-CN/CONTRIBUTING.zh-CN.md)。

您可以以向我们的官方 Github 提出 [Pull Requests](https://github.com/antvis/AVA/pulls) 或 [GitHub Issues](https://github.com/antvis/AVA/issues) 的形式提交任何想法。
让我们一起创造一个更好的开源智能可视化工具！

## 许可证

MIT
