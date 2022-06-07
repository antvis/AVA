<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> [English](../README.md) | 简体中文

<div align="center">
  <img width="200" height="120" src="../common/img/logo.svg" alt="AVA logo">
</div>

<div align="center">

<i>智能可视分析框架</i>
<i><a href="https://antv-ava.gitee.io/zh"><https://antv-ava.gitee.io/zh></a></i>

</div>

----

<a href="https://ava.antv.vision"><img src="../common/img/vectorA.svg" align="left"  width="180"  hspace="10" vspace="6"></a>

**AVA** (<img src="../common/img/vectorASymbol.svg" width="16"> Visual Analytics) 是为了更简便的可视分析而生的技术框架。 其名称中的第一个 **A** 具有多重涵义：一个智能驱动（*AI driven*）、自动化（*Automated*）、支持增强分析（*Augmented*）的可视分析解决方案。

<br />

<div align="center">
  <img width="800" src="https://gw.alipayobjects.com/zos/antfincdn/oCtZLZ5Y%26/AVA%252520Pipeline.png" alt="AVA pipeline">
</div>

## npm 包

### [AVA/AutoChart](https://github.com/antvis/AVA/blob/master/packages/auto-chart/zh-CN/README.zh-CN.md)

AutoChart 是一个可以根据数据自动推荐合适的图表并渲染的 React 组件。它可以为用户提供一行代码实现智能可视化的能力。

```protobuf
@antv/auto-chart // 一键可视化组件
```

### [AVA/CKB](https://github.com/antvis/AVA/blob/master/packages/auto-chart/zh-CN/README.zh-CN.md)

CKB 的意思是 Chart Knowledge Base，也就是图表知识库。这个包中包含了基于经验总结的关于可视化和图表的各种基本知识和观察。图表的推荐必须基于这些基本概念。

同时，这个包也让开发图表类型筛选相关的产品变得非常简单。

```protobuf
@antv/ckb // 图表知识库
```

### [AVA/DataWizard](https://github.com/antvis/AVA/blob/master/packages/data-wizard/zh-CN/README.zh-CN.md)

DataWizard 是一个基于 js/ts 的前端数据处理库。在 AVA 的框架中，它被用来理解和处理输入端的数据集。不过，它也可以独立地被用来开发一些数据处理、数学统计、数据模拟之类的功能。

```ts
import { DataFrame } from @antv/data-wizard // 数据处理模块
import { statistics } from @antv/data-wizard // 数学统计模块
import { random } from @antv/data-wizard // 数据模拟模块
```

### [AVA/ChartAdvisor](https://github.com/antvis/AVA/blob/master/packages/chart-advisor/zh-CN/README.zh-CN.md)

ChartAdvisor 是 AVA 的核心部分。它基于数据和分析需求来推荐图表类型和具体的图表细节设置。

```protobuf
@antv/chart-advisor // 图表推荐和自动生成
```

### [AVA/LiteInsight](https://github.com/antvis/AVA/blob/master/packages/lite-insight/zh-CN/README.zh-CN.md)

LiteInsight 是一个用于探索性数据分析的 js/ts 工具库，它可以从多维数据中自动地发现数据洞察。

```protobuf
@antv/lite-insight // 数据洞察库
```

### [AVA/SmartBoard](https://github.com/antvis/AVA/blob/master/packages/smart-board/zh-CN/README.zh-CN.md)

SmartBoard 是一个用于 Dashboard 数据展示的 js/ts 工具库。它根据输入图表和洞察自动生成对应的 Dashboard。

```protobuf
@antv/smart-board // 增强展现库
```

## 相关链接

* [教程文档 Guide](https://ava.antv.vision/zh/docs/guide/intro)
* [接口文档 API](https://ava.antv.vision/zh/docs/api/intro)
* [示例大全 Examples](https://ava.antv.vision/zh/examples/gallery)
* [相关知识 Wiki](https://github.com/antvis/AVA/wiki)

## 参与贡献 [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

我们欢迎任何共建。请先阅读 [贡献指南](./CONTRIBUTING.zh-CN.md)。欢迎通过 [pull requests](https://github.com/antvis/AVA/pulls) 或 [GitHub issues](https://github.com/antvis/AVA/issues) 向我们提供你的想法。让我们一起来把 AVA 做得更好！

开发指引请参考 [Wiki: Development](https://github.com/antvis/AVA/wiki/Development)。

> 强烈推荐阅读 [《提问的智慧》](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way)、[《如何向开源社区提问题》](https://github.com/seajs/seajs/issues/545) 和 [《如何有效地报告 Bug》](http://www.chiark.greenend.org.uk/%7Esgtatham/bugs-cn.html)、[《如何向开源项目提交无法解答的问题》](https://zhuanlan.zhihu.com/p/25795393)，更好的问题更容易获得帮助。

## 合作机构

<div align="center">
  <a href="https://idvxlab.com/"><img src="https://gw.alipayobjects.com/zos/antfincdn/rxgntN5msN/idvx.png" alt="iDVx" width="140" align="middle" hspace="20"></a>
</div>

## 学术成果

[VizLinter](https://vegalite-linter.idvxlab.com/)

<div style="font-size: 12px; color: grey">
Chen, Q., Sun, F., Xu, X., Chen, Z., Wang, J. and Cao, N., 2021. VizLinter: A Linter and Fixer Framework for Data Visualization. <i>IEEE transactions on visualization and computer graphics</i>, 28(1), pp.206-216.
<div>
<br>
