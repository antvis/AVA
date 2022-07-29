<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> English | [简体中文](./zh-CN/README.zh-CN.md)

<div align="center">
  <img width="200" height="120" src="./common/img/logo.svg" alt="AVA logo">
</div>

<div align="center">

<i>A framework for automated visual analytics.</i>
<i><a href="https://ava.antv.vision/en"><https://ava.antv.vision/en></a></i>

</div>

----

<a href="https://ava.antv.vision"><img src="./common/img/vectorA.svg" align="left" width="180" hspace="10" vspace="6"></a>

**AVA** (<img src="./common/img/vectorASymbol.svg" width="16">  Visual Analytics) is a framework and solution for more convenient visual analytics. The first **A** of AVA  has many meanings. It states that this framework is to become an *AI driven*, *Automated* solution that supports *Augmented* analytics.

<br />

<div align="center">
  <img width="800" src="https://gw.alipayobjects.com/zos/antfincdn/oCtZLZ5Y%26/AVA%252520Pipeline.png" alt="AVA pipeline">
</div>

## Packages

### [AVA/AutoChart](https://github.com/antvis/AVA/blob/master/packages/auto-chart)

AutoChart is a React component that automatically suggests and renders the right chart based on data.
It can automatically generate and render the proper chart for visualization based on the input data with one-line of code.

```protobuf
@antv/auto-chart // one-click visualization component
```

### [AVA/CKB](https://github.com/antvis/AVA/tree/master/packages/knowledge)

CKB stands for Chart Knowledge Base.
This package is the KB where empirical knowledge about visualization and charts is stored. The chart recommendation is based on it.

At the same time, this package also facilitates us to develop products of chart type selection.


```protobuf
@antv/ckb // to get the chart knowledge base
```

### [AVA/DataWizard](https://github.com/antvis/AVA/tree/master/packages/data-wizard)

DataWizard is a js/ts library for data processing.
In the AVA framework, it is used to understand and process the input dataset.
Moreover, it can also be used independently to develop some data processing, statistics or data mocking functions.

```ts
import { DataFrame } from @antv/data-wizard // data processing
import { statistics } from @antv/data-wizard // statistical methods
import { random } from @antv/data-wizard // data mocking
```

### [AVA/ChartAdvisor](https://github.com/antvis/AVA/tree/master/packages/chart-advisor)

ChartAdvisor is the core component of AVA. It recommends charts based on dataset and analysis needs.

```protobuf
@antv/chart-advisor // to make charts automatically
```

### [AVA/LiteInsight](https://github.com/antvis/AVA/blob/master/packages/lite-insight)

LiteInsight is a js/ts library employed for Exploratory Data Analysis (EDA).
It can automatically discover data insights from multidimensional data.

```protobuf
@antv/lite-insight // to get data insight
```

### [AVA/SmartBoard](https://github.com/antvis/AVA/blob/master/packages/smart-board)

SmartBoard is a js/ts library employed for Dashboard visualization of charts.
It can automatically generates the corresponding Dashboard configurations based on input charts and insights.

```protobuf
@antv/smart-board // to get Dashboard parameters
```

## Sources

* [Guide](https://ava.antv.vision/en/docs/guide/intro)
* [API](https://ava.antv.vision/en/docs/api)
* [Examples](https://ava.antv.vision/en/examples/gallery)
* [Wiki](https://github.com/antvis/AVA/wiki)

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
