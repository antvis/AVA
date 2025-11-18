<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18" alt="中英文切换"> [English](./README.md) | 简体中文

<div align="center">
  <img width="200" height="120" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original" alt="AVA 标志">
</div>

<div align="center">

<i>一个 **A**I 驱动的 **V**isual **A**nalytics（可视化分析）框架。</i>
<i><a href="https://ava.antv.antgroup.com/"><https://ava.antv.antgroup.com></a></i>

</div>

[AVA](https://github.com/antvis/AVA) (<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*QzIsSrfsCW0AAAAAAAAAAAAADmJ7AQ/original" width="16" alt="AVA 示例"> 可视化分析) 是专为更便捷的 AI 驱动可视化分析设计的技术框架。首字母 **A** 具有多重含义：AI 驱动（AI driven）、自动化（Automated）、增强分析（Augmented），**VA** 代表可视化分析（Visual Analytics）。它能协助用户完成数据提取处理、从数据中发掘洞察、推荐并生成图表。
<br />

<div align="center">
  <img width="800" src="https://mdn.alipayobjects.com/huamei_kjfwsg/afts/img/A*OmYvSbCXy2gAAAAAAAAAAAAADvmcAQ/original" alt="AVA 示例">

  <p align="center">
    <a href="https://ava.antv.antgroup.com/guide" target="_blank">教程</a> •
    <a href="https://ava.antv.antgroup.com/api/antv-spec/antv-spec" target="_blank">API 文档</a> •
    <a href="https://ava.antv.antgroup.com/examples" target="_blank">示例</a> •
    <a href="https://github.com/antvis/mcp-server-chart" target="_blank">MCP 服务</a>
  </p>
</div>


## 核心特性

* **AI 驱动**：基于 AI 技术，可自动处理数据、推荐图表并生成图表。
* **丰富的知识库与图表类型**：提供丰富的图表知识库，支持 25+ 图表类型，包括折线图、柱状图、饼图、散点图等。
* **功能全面且高度可定制**：功能覆盖数据分析全流程，连接人与数据，打通数据分析链"最后一公里"，支持图表渲染与交互的自定义。
* **同构 Spec 规范**：包含同构的 AntV Spec 规范，可应用于不同场景下的图表生成。


## 构成组件

`AVA 系列`包含 3 个核心包：[@antv/ava](https://github.com/antvis/AVA)、[@antv/gpt-vis](https://github.com/antvis/GPT-Vis) 和 [@antv/mcp-server-chart](https://github.com/antvis/mcp-server-chart)： 

* [@antv/ava](https://www.npmjs.com/package/@antv/ava) : AVA 核心包，包含以下模块：
  * `data (数据处理)`: 数据处理模块，用于数据集的统计分析及处理。
  * `extract (数据提取)`: 从结构化/非结构化数据中提取元信息，用于图表推荐。
  * `insight (自动洞察)`: 自动洞察模块，从多维数据中自动发现数据洞察。
  * `advise (图表推荐)`: 图表推荐模块，基于数据和分析需求推荐图表类型及具体配置（AntV 的 `Specification` 规范）。
  * `render (图表渲染)`: 图表渲染模块，基于推荐结果通过 `GPT-Vis` 渲染图表。

* [@antv/gpt-vis](https://github.com/antvis/GPT-Vis) : 面向 GPT、生成式 AI 和 LLM 项目的组件库，包含：
  * `LLM 协议`：面向 LLM Agent 卡片设计的可视化协议，适用于 LLM 对话交互与服务序列化输出，便于快速集成至 AI 应用。
  * `图表知识库`：提供丰富的图表知识库数据，支持基于 RAG 和提示工程的图表推荐。
  * `<GPTVis />`：为 LLM 应用开发的组件，内置 20+ 常用可视化组件，提供便捷的扩展机制和架构设计。

* [@antv/mcp-server-chart](https://github.com/antvis/mcp-server-chart) : 包含 `25+` 个 @antvis 可视化图表的 MCP 服务，用于图表生成与数据分析。
  * `25+ 图表类型`：包含数据分析常用图表，可轻松集成至数据分析链路。
  * `同构规范`：遵循标准图表生成规范，支持跨场景图表生成，与 `AVA` 规范同构。
  


## 快速开始

可通过 npm 安装 [@antv/ava](https://www.npmjs.com/package/@antv/ava) 和 [@antv/gpt-vis](https://www.npmjs.com/package/@antv/gpt-vis)：

```bash
$ npm install @antv/ava
$ npm install @antv/gpt-vis
```

以下示例展示 [@antv/ava](https://www.npmjs.com/package/@antv/ava) 的用法：

1. **示例 1**：使用 [@antv/ava](https://www.npmjs.com/package/@antv/ava) 的 `insight (自动洞察)` 模块提取数据洞察。输入多维数据后，后端自动运行不同算法发现数据中的潜在规律，通过统一评估返回高质量数据洞察。

    ```js
    import { getInsights } from '@antv/ava';

    // 输入：多维数据
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

    // insightRes 包含从数据中发现的有趣洞察
    const insightRes = getInsights(data)
    ```

2. **示例 2**：使用 [@antv/ava](https://www.npmjs.com/package/@antv/ava) 的 `advise (图表推荐)` 模块推荐图表，并通过 `GPT-Vis` 渲染推荐结果。

    ```js
    import { AVA } from '@antv/ava';

    // 输入：多维数据
    const data = `请可视化以下数据： 
     城市 人口数 GDP
     北京 2000 5000
     上海 2100 6000
     天津 800 3000
     重庆 2200 4000
     杭州 900 3000
    `;

    // 创建 AVA 实例
    const ava = new AVA({ /*...*/ });

    // 提取元信息
    const meta = ava.extract(data);

    // 获取图表推荐
    const charts = ava.advise(meta);
    ```


## 参与贡献 [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

我们欢迎所有贡献，请先阅读[贡献指南](./CONTRIBUTING.md)。您可以通过 [PR](https://github.com/antvis/AVA/pulls) 或 [GitHub Issues](https://github.com/antvis/AVA/issues) 提交想法。让我们共同打造更好的 AVA。

<div align="center">
  <a href="https://idvxlab.com/"><img src="https://gw.alipayobjects.com/zos/antfincdn/rxgntN5msN/idvx.png" alt="iDVx" width="140" align="middle" hspace="20"></a>
</div>


## 学术论文

<sub>1. [VizLinter](https://vegalite-linter.idvxlab.com/): Chen, Q., Sun, F., Xu, X., Chen, Z., Wang, J. and Cao, N., 2021. VizLinter: A Linter and Fixer Framework for Data Visualization. <i>IEEE transactions on visualization and computer graphics</i>, 28(1), pp.206-216.</suub>

<sub>2. [Exploring the Typology of Visualization Design](https://oversea.cnki.net/KCMS/detail/detail.aspx?dbcode=CJFD&dbname=CJFDAUTO&filename=MSDG202203021&uniplatform=OVERSEAS_EN&v=HcZsiecIxauSoKEB1s92_BImgnrMiazYsfZUpb-gcl0zXYx_MEwv5alz1UgtPjz1): 蓝星宇, 王嘉喆. 数据可视化设计的类型学实践, 《美术大观》, 2022(3), 149-152.</sub>


## 开源协议

MIT@[AntV](https://github.com/antvis)。
