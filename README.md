<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18" alt="Switch between English and Chinese"> English | [简体中文](./README.zh-CN.md)

<div align="center">
  <img width="200" height="120" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original" alt="AVA logo">
</div>

<div align="center">

<i>A framework for automated visual analytics.</i>
<i><a href="https://ava.antv.antgroup.com/"><https://ava.antv.antgroup.com></a></i>

</div>

----

## What is AVA

[AVA](https://github.com/antvis/AVA) (<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*QzIsSrfsCW0AAAAAAAAAAAAADmJ7AQ/original" width="16" alt="AVA examples"> Visual Analytics) is a technology framework designed for more convenient visual analytics. The first **A** has multiple meanings: AI driven, Automated, Augmented, and **VA** stands for Visual Analytics. It can assist users in data processing, extracting insights from data, recommending and generating charts, and optimizing existing charts.
<br />

<div align="center">
  <img width="800" src="https://mdn.alipayobjects.com/huamei_kjfwsg/afts/img/A*OmYvSbCXy2gAAAAAAAAAAAAADvmcAQ/original" alt="AVA examples">
</div>

## Composition

AVA contains 2 packages, [@antv/ava](https://www.npmjs.com/package/@antv/ava) and [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react) : 

* [@antv/ava](https://www.npmjs.com/package/@antv/ava) : AVA core package, containing four main modules:

  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">data (Data Processing)</span>: Data Processing Module. Used for statistical analysis and processing of datasets.
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">insight (Auto Insight)</span>: Automatic Insights Module. Automatically discover data insights from multi-dimensional data.
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">ckb (Chart Knowledge Base)</span>: Chart Knowledge Base Module. Based on empirically derived knowledge and observations about the various fundamentals of visualization and charts, it is the cornerstone of intelligent chart recommendations.
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">advisor (Chart Recommendation)</span>: Chart Recommendation Module. Recommend chart types and specific chart detail settings based on data and analysis needs, as well as chart optimization for existing charts.

* [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react) : A plug-and-play React component library based on the integration of AVA capabilities, it contains three core components:
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">\<NarrativeTextVis \/></span>: Demonstrate data insight interpretation text. In a full-flow presentation of data analysis, using text to describe data phenomena is as critical as giving insightful conclusions.
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">\<InsightCard \/></span>: Present data insights in a combination of graphics and text. It is possible to either receive data directly and perform insights automatically, or to visualize and interpret only the insight result data for presentation.
  * <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">\<AutoChart \/></span>>: Automatically recommends and renders the appropriate chart based on the data. It provides users with the ability to implement intelligent visualizations in one line of code, and the component is currently undergoing further upgrades.


## Features

* Intelligent drive: Integrates automation and intelligence to simplify the visual analysis process.
* Rich functions: Its functions cover the whole process of data analysis, linking people and data, and connecting the "last mile" of the data analysis chain.
* Flexible syntax: Rich built-in configuration items and support for customization.

## Documentation

* <a href='https://ava.antv.antgroup.com/guide/intro' target='_blank'>Tutorial</a>
* <a href='https://ava.antv.antgroup.com/api/ckb/ckb' target='_blank'>API</a>
* <a href='https://ava.antv.antgroup.com/examples' target='_blank'>Examples</a>

## Getting Started

NPM package manager can be used to install  [@antv/ava](https://www.npmjs.com/package/@antv/ava) and [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react).

```bash
$ npm install @antv/ava
$ npm install @antv/ava-react
```

The following two examples show the use of [@antv/ava](https://www.npmjs.com/package/@antv/ava) and [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react) respectively (demo code based on React):

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
 
2. **Demo 2**: Use <span style="background-color:#A9A9A9; padding:2px 4px; border-radius:4px;color: black;">\<InsightCard \/></span> in [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react) to display the insight results. This component can display data insight results directly, here using the insight results from Demo 1 as input:

    ```html
    <div id="root"></div>
    ```

    ```js
    // import <InsightCard /> component
    import { InsightCard } from '@antv/ava-react';

    const root = ReactDOM.createRoot(document.getElementById('root'));

    // render
    root.render(
      <InsightCard insightInfo={insightRes.insights[0]} visualizationOptions={{ lang: 'zh-CN' }} />
    );
    ```

    The result of the rendering is as follows:
    <div align="center">
      <img width="800" src="https://mdn.alipayobjects.com/huamei_kjfwsg/afts/img/A*i0jhSKWjCbkAAAAAAAAAAAAADvmcAQ/original" alt="Data Insight Results">
    </div>



## Contribution [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

We welcome all contributions. Please read our [Contributing Guide](./CONTRIBUTING.md) first. You can submit any ideas as [pull requests](https://github.com/antvis/AVA/pulls) or as [GitHub issues](https://github.com/antvis/AVA/issues). Let's build a better AVA together.

More at [Wiki: Development](https://github.com/antvis/AVA/wiki/Development).

## Collaboration

<div align="center">
  <a href="https://idvxlab.com/"><img src="https://gw.alipayobjects.com/zos/antfincdn/rxgntN5msN/idvx.png" alt="iDVx" width="140" align="middle" hspace="20"></a>
</div>

## Papers

[VizLinter](https://vegalite-linter.idvxlab.com/)

<div style="font-size: 12px; color: grey">
Chen, Q., Sun, F., Xu, X., Chen, Z., Wang, J. and Cao, N., 2021. VizLinter: A Linter and Fixer Framework for Data Visualization. <i>IEEE transactions on visualization and computer graphics</i>, 28(1), pp.206-216.
</div>
<br>

[《数据可视化设计的类型学实践》（Exploring the Typology of Visualization Design）](https://oversea.cnki.net/KCMS/detail/detail.aspx?dbcode=CJFD&dbname=CJFDAUTO&filename=MSDG202203021&uniplatform=OVERSEAS_EN&v=HcZsiecIxauSoKEB1s92_BImgnrMiazYsfZUpb-gcl0zXYx_MEwv5alz1UgtPjz1)

<div style="font-size: 12px; color: grey">
蓝星宇, 王嘉喆. 数据可视化设计的类型学实践, 《美术大观》, 2022(3), 149-152.
</div>

## License

MIT@[AntV](https://github.com/antvis).
