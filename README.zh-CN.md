<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> [English](./README.md) | 简体中文

<div align="center">
  <img width="200" height="120" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original" alt="AVA logo">
</div>

<div align="center">

<i>智能可视分析框架</i>
<i><a href="https://ava.antv.antgroup.com/"><https://ava.antv.antgroup.com></a></i>

</div>

----
## ❓ 什么是AVA
[AVA](https://github.com/antvis/AVA)是为了更简便的可视分析而生的技术框架。它可以辅助用户进行数据处理、提取数据洞察、实现图表的推荐和自动生成，此外它还可以优化已有的图表。

**AVA** (<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*QzIsSrfsCW0AAAAAAAAAAAAADmJ7AQ/original" width="16"> Visual Analytics) 中的第一个 **A** 具有多重涵义：一个智能驱动（*AI driven*）、自动化（*Automated*）、支持增强分析（*Augmented*）的可视分析解决方案。
<br />

<div align="center">
  <img width="800" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*ZINwQ6ubADQAAAAAAAAAAAAADmJ7AQ/original" alt="AVA pipeline">
</div>

## 📁 AVA的组成
AVA包含2个包，分别为 [@antv/ava](https://www.npmjs.com/package/@antv/ava) 和 [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react)：
+ [@antv/ava](https://www.npmjs.com/package/@antv/ava) ：AVA核心包，包含四大主要模块：
  + **data (数据处理)** ：数据处理器。用于数据集统计分析和处理。
  + **insight (智能洞察)**：自动洞察器。自动地从多维数据中发现数据洞察。
  + **ckb (图表知识库)：图表知识库**。基于经验总结的关于可视化和图表的各种基本知识和观察，图表的推荐必须基于这些基本概念。
  + **advisor (图表推荐和自动生成)**：图表建议官。基于数据和分析需求来推荐图表类型和具体的图表细节设置，也可对既有的图表进行图表优化。
+ [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react)：React 组件库，提供了可以直接使用新的解读文本模块 NTV 的组件，支持叙述性文本可视化。

## ✨ AVA的特性
- 丰富的功能
- 灵活的语法
- 简便的用法


## 💻 开始使用
可以通过 NPM 包管理器来安装。
```bash
$ npm install @antv/ava
$ npm install @antv/ava-react
```

安装成功后，可以使用 import 导入 AVA 中的功能函数或者组件。
```html
<div id="mountNode"></div>
```
```js
import { getInsights } from '@antv/ava';
import { InsightCard } from '@antv/ava-react';

const data = [
  { year: '2000', value: 1 },
  { year: '2001', value: -1 },
  { year: '2002', value: 2 },
  { year: '2003', value: -2 },
  { year: '2004', value: 7 },
  { year: '2005', value: 3 },
  { year: '2006', value: -3 },
  { year: '2007', value: 0 },
  { year: '2008', value: 0 },
  { year: '2009', value: 1 },
]

const firstInsight = getInsights(data).insights[0]

ReactDOM.render(
  <>
    <InsightCard insightInfo={firstInsight} visualizationOptions={{ lang: 'zh-CN' }} />
  </>,
  mountNode,
);
```

## 🔧 开发


## 📑 文档
+ <a href='https://ava.antv.antgroup.com/guide/intro' target='_blank'>入门教程</a>
+ <a href='https://ava.antv.antgroup.com/api/ckb/ckb' target='_blank'>API文档</a>
+ <a href='https://ava.antv.antgroup.com/examples' target='_blank'>图表示例</a>


## 👥 参与贡献 [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

我们欢迎任何共建。请先阅读 [贡献指南](./CONTRIBUTING.zh-CN.md)。欢迎通过 [pull requests](https://github.com/antvis/AVA/pulls) 或 [GitHub issues](https://github.com/antvis/AVA/issues) 向我们提供你的想法。让我们一起来把 AVA 做得更好！

开发指引请参考 [Wiki: Development](https://github.com/antvis/AVA/wiki/Development)。

> 强烈推荐阅读 [《提问的智慧》](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way)、[《如何向开源社区提问题》](https://github.com/seajs/seajs/issues/545) 和 [《如何有效地报告 Bug》](http://www.chiark.greenend.org.uk/%7Esgtatham/bugs-cn.html)、[《如何向开源项目提交无法解答的问题》](https://zhuanlan.zhihu.com/p/25795393)，更好的问题更容易获得帮助。

## 🏫 合作机构

<div align="center">
  <a href="https://idvxlab.com/"><img src="https://gw.alipayobjects.com/zos/antfincdn/rxgntN5msN/idvx.png" alt="iDVx" width="140" align="middle" hspace="20"></a>
</div>

## 📜 学术成果

[VizLinter](https://vegalite-linter.idvxlab.com/)

<div style="font-size: 12px; color: grey">
Chen, Q., Sun, F., Xu, X., Chen, Z., Wang, J. and Cao, N., 2021. VizLinter: A Linter and Fixer Framework for Data Visualization. <i>IEEE transactions on visualization and computer graphics</i>, 28(1), pp.206-216.
</div>
<br>

[《数据可视化设计的类型学实践》](https://www.cnki.com.cn/Article/CJFDTotal-MSDG202203021.htm)

<div style="font-size: 12px; color: grey">
蓝星宇, 王嘉喆. 数据可视化设计的类型学实践, 《美术大观》, 2022(3), 149-152.
</div>

## ❗ 许可证

MIT@[AntV](https://github.com/antvis).

<!-- ## npm 包

### [@antv/ava](https://github.com/antvis/AVA/blob/master/packages/ava)

### [@antv/ava-react](https://github.com/antvis/AVA/tree/master/packages/ava-react) -->