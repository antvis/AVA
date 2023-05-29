<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> [English](./README.md) | 简体中文

<div align="center">
  <img width="200" height="120" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original" alt="AVA logo">
</div>

<div align="center">

<i>智能可视分析框架</i>
<i><a href="https://ava.antv.antgroup.com/"><https://ava.antv.antgroup.com></a></i>

</div>

----

## 什么是 AVA

[AVA](https://github.com/antvis/AVA)（<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*QzIsSrfsCW0AAAAAAAAAAAAADmJ7AQ/original" width="16" alt="AVA examples"> Visual Analytics）是为了更简便的可视分析而生的技术框架。第一个 **A** 具有多重涵义：智能驱动（*AI driven*）、自动化（*Automated*）、支持增强分析（*Augmented*）, **VA** 代表可视分析。它可以辅助用户进行**数据处理**、提取**数据洞察**、实现**图表的推荐和自动生成**，此外它还可以**优化已有的图表**。
<br />

<div align="center">
  <img width="800" src="https://mdn.alipayobjects.com/huamei_kjfwsg/afts/img/A*wpo3RpdULnAAAAAAAAAAAAAADvmcAQ/original" alt="AVA pipeline">
</div>

## AVA 的组成

AVA 包含2个包，分别为 [@antv/ava](https://www.npmjs.com/package/@antv/ava) 和 [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react) ：

* [@antv/ava](https://www.npmjs.com/package/@antv/ava) ：AVA 核心包，包含四大主要模块：

  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">data (数据处理)</span>：数据处理模块。用于数据集统计分析和处理。
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">insight (智能洞察)</span>：自动洞察模块。自动地从多维数据中发现数据洞察。
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">ckb (图表知识库)</span>：图表知识库模块。基于经验总结的关于可视化和图表的各种基本知识和观察，它是智能图表推荐的基石。
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">advisor (图表推荐和自动生成)</span>：图表推荐模块。基于数据和分析需求来推荐图表类型和具体的图表细节设置，也可对既有的图表进行图表优化。

* [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react) ：基于 AVA 能力整合而成的即插即用的 React 组件库， 它包含三大核心组件：
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">\<NarrativeTextVis \/></span>：展示数据洞察解读文本。在数据分析的全流程展示中，使用文本描述数据现象和给出洞察结论同样关键。
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">\<InsightCard \/></span>：以图文结合的方式展示数据洞察。既可以直接接收数据并自动进行洞察，也可以仅对洞察结果数据进行可视化和解读的展示。
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">\<AutoChart \/></span>>：根据数据自动推荐合适的图表并渲染。它可以为用户提供一行代码实现智能可视化的能力，目前该组件正在进一步升级中。


## AVA 的特性

* 智能式驱动：集自动化、智能化于一体，简化可视分析过程。
* 丰富的功能：其功能覆盖数据分析全过程，链接人和数据，联通数据分析链条上的“最后一公里”。
* 灵活的语法：内置丰富的配置项，支持自定义。

## 文档

* <a href='https://ava.antv.antgroup.com/guide/intro' target='_blank'>入门教程</a>
* <a href='https://ava.antv.antgroup.com/api/ckb/ckb' target='_blank'>API文档</a>
* <a href='https://ava.antv.antgroup.com/examples' target='_blank'>图表示例</a>

## 开始使用

可以通过 NPM 包管理器来安装 [@antv/ava](https://www.npmjs.com/package/@antv/ava) 和 [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react)。

```bash
$ npm install @antv/ava
$ npm install @antv/ava-react
```

以下两个案例分别展示了 [@antv/ava](https://www.npmjs.com/package/@antv/ava) 和 [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react) 的使用方式（演示代码基于 React ）：

1. **案例一**：使用 [@antv/ava](https://www.npmjs.com/package/@antv/ava) 中的 <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">insight (智能洞察) 模块</span> 提取数据洞察。输入多维数据，后台自动运行不同算法来发现数据中有趣的模式，统一评估后按照分数返回高质量的数据洞察结果。

    ```js
    import { getInsights } from '@antv/ava';

    //  输入：多维数据
    const data = [
        { year: '2000', value: 100 },
        { year: '2001', value: 200 },
        { year: '2002', value: 220 },
        { year: '2003', value: 230 },
        { year: '2004', value: 245 },
        { year: '2005', value: 156 },
        { year: '2006', value: 178 },
        { year: '2007', value: 180 },
        { year: '2008', value: 190 },
        { year: '2009', value: 1000 },
    ]

    // insightRes 中包含数据中有趣的洞察 insights
    const insightRes = getInsights(data)
    ```
 
2. **案例二**：使用 [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react) 中的 <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">\<InsightCard \/></span> 展示洞察结果。该组件可以直接展示数据洞察结果，这里以案例一中的洞察结果作为输入：

    ```html
    <div id="root"></div>
    ```

    ```js
    // 引入 <InsightCard /> 组件
    import { InsightCard } from '@antv/ava-react';

    const root = ReactDOM.createRoot(document.getElementById('root'));

    // 渲染
    root.render(
      <InsightCard insightInfo={insightRes.insights[0]} visualizationOptions={{ lang: 'zh-CN' }} />
    );
    ```

    渲染的结果如下：
    <div align="center">
      <img width="800" src="https://mdn.alipayobjects.com/huamei_kjfwsg/afts/img/A*zPmRRLD5JFAAAAAAAAAAAAAADvmcAQ/original" alt="数据洞察结果展示">
    </div>



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
</div>
<br>

[《数据可视化设计的类型学实践》](https://www.cnki.com.cn/Article/CJFDTotal-MSDG202203021.htm)

<div style="font-size: 12px; color: grey">
蓝星宇, 王嘉喆. 数据可视化设计的类型学实践, 《美术大观》, 2022(3), 149-152.
</div>

## 许可证

MIT@[AntV](https://github.com/antvis).
