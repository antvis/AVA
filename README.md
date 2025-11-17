<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18" alt="Switch between English and Chinese"> English | [简体中文](./README.zh-CN.md)

<div align="center">
  <img width="200" height="120" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original" alt="AVA logo">
</div>

<div align="center">

<i>A framework for **A**I driven **V**isual **A**nalytics.</i>
<i><a href="https://ava.antv.antgroup.com/"><https://ava.antv.antgroup.com></a></i>

</div>

[AVA](https://github.com/antvis/AVA) (<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*QzIsSrfsCW0AAAAAAAAAAAAADmJ7AQ/original" width="16" alt="AVA examples"> Visual Analytics) is a technology framework designed for more convenient visual analytics with AI. The first **A** has multiple meanings: AI driven, Automated, Augmented, and **VA** stands for Visual Analytics. It can assist users in data extracting and processing, extracting insights from data, recommending and generating charts.
<br />

<div align="center">
  <img width="800" src="https://mdn.alipayobjects.com/huamei_kjfwsg/afts/img/A*OmYvSbCXy2gAAAAAAAAAAAAADvmcAQ/original" alt="AVA examples">

  <p align="center">
    <a href="https://ava.antv.antgroup.com/guide/intro" target="_blank">Tutorial</a> •
    <a href="https://ava.antv.antgroup.com/api" target="_blank">API documentation</a> •
    <a href="https://ava.antv.antgroup.com/examples" target="_blank">Examples</a> •
    <a href="https://github.com/antvis/mcp-server-chart" target="_blank">MCP Server</a>
  </p>
</div>


## Features

* AI driven: Based on AI, it can automatically process data, recommend charts, and generate charts.
* Rich knowledge base and charts: It provides a rich knowledge base of charts and supports 25+ charts, including line charts, bar charts, pie charts, scatter plots, and more.
* Rich functions and Highly customizable: Its functions cover the whole process of data analysis, linking people and data, and connecting the "last mile" of the data analysis chain and support for customization of chart rendering, and chart interaction.
* Isomorphic: It contains an isomorphic AntV specification, which can be used to generate charts in different scenarios`.


## Composition

`AVA series` contains 3 packages, [@antv/ava](https://github.com/antvis/AVA), [@antv/gpt-vis](https://github.com/antvis/GPT-Vis) and [@antv/mcp-server-chart](https://github.com/antvis/mcp-server-chart): 

* [@antv/ava](https://www.npmjs.com/package/@antv/ava) : AVA core package, containing main modules below:
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">data (Data Processing)</span>: Data Processing Module. Used for statistical analysis and processing of datasets.
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">extract (Data Processing)</span>: Extract data meta from structured and unstructured data, used for chart recommendation.
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">insight (Auto Insight)</span>: Automatic Insights Module. Automatically discover data insights from multi-dimensional data.
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">advise (Chart Recommendation)</span>: Chart Recommendation Module. Recommend chart types and specific chart detail settings based on data and analysis needs, which is the  `Specification` of antvis.
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">render (Chart Renderring)</span>: Chart Renderring Module. Render charts based on the recommended chart types and settings with `GPT-Vis`.

* [@antv/gpt-vis](https://github.com/antvis/GPT-Vis) : Components for GPTs, generative AI, and LLM projects, not only UI Components, it contains:
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">LLM Protocol</span>: A visual protocol for LLM Agent cards, designed for LLM conversational interaction and service serialized output, to facilitate rapid integration into AI applications.
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">Chart knowledge base</span>: Provides a rich set of chart knowledge base data, which can be used to recommend charts by RAG and prompt-based generation.
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">\<GPTVis \/></span>: Developed components for LLM applications, with 20+ commonly used VIS components built-in, providing convenient expansion mechanism and architecture design for customized UI requirements.
  
* [@antv/mcp-server-chart](https://github.com/antvis/mcp-server-chart) : A visualization mcp contains `25+` visual charts using @antvis. Using for chart generation and data analysis.
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">25+ Charts</span>: It contains `25+` visual charts frequently used in data analysis, freely and easily integrated into the data analysis chain.
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">Isomorphic Specification</span>: It is a standard specification for chart generation, which can be used to generate charts in different scenarios, isomorphic with the specification of `AVA`.
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">\<GPTVis \/></span>: Developed components for LLM applications, with 20+ commonly used VIS components built-in, providing convenient expansion mechanism and architecture design for customized UI requirements.
  


## Getting Started

NPM package manager can be used to install [@antv/ava](https://www.npmjs.com/package/@antv/ava) and [@antv/gpt-vis](https://www.npmjs.com/package/@antv/gpt-vis).

```bash
$ npm install @antv/ava
$ npm install @antv/gpt-vis
```

The following two examples show the use of [@antv/ava](https://www.npmjs.com/package/@antv/ava) and [@antv/gpt-vis](https://www.npmjs.com/package/@antv/gpt-vis) respectively:

1. **Demo 1**: Use the <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">insight (Auto Insight)</span> in [@antv/ava](https://www.npmjs.com/package/@antv/ava) to extract data insights. Input multi-dimensional data, the backend automatically runs different algorithms to find interesting patterns in the data, evaluates them uniformly and returns high-quality data insights according to the score.

    ```js
    import { getInsights } from '@antv/ava';

    //  Input: Multi-dimensional data
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

    // The insightRes contains interesting insights from the data.
    const insightRes = getInsights(data)
    ```

2. **Demo 2**: Use the <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">advise (Chart Recommendation)</span> in [@antv/ava](https://www.npmjs.com/package/@antv/ava) to recommend charts, and render charts based on the recommended chart types and settings with `GPT-Vis`.

    ```js
    import { AVA } from '@antv/ava';

    //  Input: Multi-dimensional data
    const data = `Help to visualize the data below: 
     城市 人口数 GDP
     北京 2000 5000
     上海 2100 6000
     天津 800 3000
     重庆 2200 4000
     杭州 900 3000
    `;

    // new AVA instance.
    const ava = new AVA({ /*...*/ });

    // Extract data information.
    const meta = ava.extract(data);

    // Get chart recommendations.
    const charts = ava.advise(meta);
    ```


## Contribution [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

We welcome all contributions. Please read our [Contributing Guide](./CONTRIBUTING.md) first. You can submit any ideas as [pull requests](https://github.com/antvis/AVA/pulls) or as [GitHub issues](https://github.com/antvis/AVA/issues). Let's build a better AVA together.

<div align="center">
  <a href="https://idvxlab.com/"><img src="https://gw.alipayobjects.com/zos/antfincdn/rxgntN5msN/idvx.png" alt="iDVx" width="140" align="middle" hspace="20"></a>
</div>


## Papers

1. [VizLinter](https://vegalite-linter.idvxlab.com/): <span style="font-size: 12px; color: grey">
  Chen, Q., Sun, F., Xu, X., Chen, Z., Wang, J. and Cao, N., 2021. VizLinter: A Linter and Fixer Framework for Data Visualization. <i>IEEE transactions on visualization and computer graphics</i>, 28(1), pp.206-216.
  </span>

2. [Exploring the Typology of Visualization Design](https://oversea.cnki.net/KCMS/detail/detail.aspx?dbcode=CJFD&dbname=CJFDAUTO&filename=MSDG202203021&uniplatform=OVERSEAS_EN&v=HcZsiecIxauSoKEB1s92_BImgnrMiazYsfZUpb-gcl0zXYx_MEwv5alz1UgtPjz1): <span style="font-size: 12px; color: grey">
蓝星宇, 王嘉喆. 数据可视化设计的类型学实践, 《美术大观》, 2022(3), 149-152.
</span>


## License

MIT@[AntV](https://github.com/antvis).
