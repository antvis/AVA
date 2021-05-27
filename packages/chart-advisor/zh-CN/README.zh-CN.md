<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> [English](../README.md) | 简体中文

<h1 align="center">
  <p>ChartAdvisor</p>
  <span style="font-size: 24px;">AVA/chart-advisor</span>
</h1>

<div align="center">

基于数据和分析需求来推荐和自动生成图表

[![Version](https://badgen.net/npm/v/@antv/chart-advisor)](https://www.npmjs.com/@antv/chart-advisor)
[![NPM downloads](http://img.shields.io/npm/dm/@antv/chart-advisor.svg)](http://npmjs.com/@antv/chart-advisor)

</div>

## 演示案例

```html
<div id="mountNode"></div>
```

```js
import { autoChart } from '@antv/chart-advisor';

const container = document.getElementById('mountNode');

const data = [
  {field1: 'a', field2: '100'},
  {field1: 'b', field2: '300'},
  {field1: 'c', field2: '800'},
];

autoChart(container, data, {toolbar: true, development: true});
```

<br>

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/QTJPYXJpjW/avademo.gif" alt="AVA demo">
</div>

## 特性

### 图表推荐

通过分析给定的数据集和分析需求，推荐出一个图表配置列表。位于列表首位的是推荐值最高的图表配置。

### 图表生成

根据图表配置，自动生成和渲染图表到指定的容器中。

## 安装

```bash
$ npm install @antv/chart-advisor
```

## 使用

```js
import { autoChart } from '@antv/chart-advisor';

autoChart(container, data, {toolbar: true, development: true});
```

## 文档

本项目目前还处于测试阶段，我们热切欢迎任何贡献和共建。

但如果你想要在线上正式产品中使用本项目，请务必锁定版本，并保持关注本项目的更新进展。


* [快速接口文档](./API.zh-CN.md)
* [详细 API Reference](../../../docs/api/chart-advisor.md)

## 贡献

我们欢迎任何共建。请先阅读 [通用贡献指南](../../../zh-CN/CONTRIBUTING.zh-CN.md)。

欢迎通过 [pull requests](https://github.com/antvis/AVA/pulls) 或 [GitHub issues](https://github.com/antvis/AVA/issues) 向我们提供你的想法。让我们一起来把 AVA 做得更好！

> 强烈推荐阅读 [《提问的智慧》](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way)、[《如何向开源社区提问题》](https://github.com/seajs/seajs/issues/545) 和 [《如何有效地报告 Bug》](http://www.chiark.greenend.org.uk/%7Esgtatham/bugs-cn.html)、[《如何向开源项目提交无法解答的问题》](https://zhuanlan.zhihu.com/p/25795393)，更好的问题更容易获得帮助。

## 证书

MIT

## 友情链接

<img src="https://gw.alipayobjects.com/zos/antfincdn/1yMwFkBvyV/chartcube-logo-cube.svg" width="18"> [ChartCube](https://chartcube.alipay.com/) - 基于 [G2Plot](https://github.com/antvis/G2Plot) 的在线图表制作工具，交互简单，一键导出图表代码！
