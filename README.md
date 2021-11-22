<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> English | [简体中文](./zh-CN/README.zh-CN.md)

<div align="center">
  <img width="200" height="120" src="./common/img/logo.svg" alt="AVA logo">
</div>

<div align="center">

<i>A framework for automated visual analytics.</i>
<i><a href="https://ava.antv.vision/en"><https://ava.antv.vision/en></a></i>

</div>

----

<a href="https://ava.antv.vision"><img src="./common/img/vectorA.svg" align="left" hspace="10" vspace="6"></a>

**AVA** (![AVA logo](./common/img/vectorASymbol.svg) Visual Analytics) is a framework (or a solution) for more convenient visual analytics. The first **A** of AVA  has many meanings. It states that this framework is from *Alibaba*, and its goal is to become an *Automated*, *AI driven* solution that supports *Augmented* analytics.

<br />

## Packages

### [AVA/AutoChart](https://github.com/antvis/AVA/blob/master/packages/auto-chart)

AutoChart is a React component that automatically suggests and renders the right chart based on data.
It can automatically generate and render the proper chart for visualization based on the input data with one-line of code.

```sign
@antv/auto-chart // one-click visualization component
```

### [AVA/CKB](https://github.com/antvis/AVA/tree/master/packages/knowledge)

CKB stands for Chart Knowledge Base.
This package is the KB where empirical knowledge about visualization and charts is stored. The chart recommendation is based on it.

At the same time, this package also facilitates us to develop products of chart type selection.


```sign
@antv/knowledge // to get the chart knowledge base
```

### [AVA/DataWizard](https://github.com/antvis/AVA/tree/master/packages/data-wizard)

DataWizard is a js/ts library for data processing.
In the AVA framework, it is used to understand and process the input dataset.
Moreover, it can also be used independently to develop some data processing, statistics or data mocking functions.

```sign
import { DataFrame } from @antv/data-wizard // data processing
import { statistics } from @antv/data-wizard // statistical methods
import { random } from @antv/data-wizard // data mocking
```

### [AVA/ChartAdvisor](https://github.com/antvis/AVA/tree/master/packages/chart-advisor)

ChartAdvisor is the core component of AVA. It recommends charts based on dataset and analysis needs.

```sign
@antv/chart-advisor // to make charts automatically
```

### [AVA/LiteInsight](https://github.com/antvis/AVA/blob/master/packages/lite-insight)

LiteInsight is a js/ts library employed for Exploratory Data Analysis (EDA).
It can automatically discover data insights from multidimensional data.

```sign
@antv/lite-insight // to get data insight
```

### [AVA/SmartBoard](https://github.com/antvis/AVA/blob/master/packages/smart-board)

SmartBoard is a js/ts library employed for Dashboard visualization of charts.
It can automatically generates the corresponding Dashboard configurations based on input charts and insights.

```sign
@antv/smart-board // to get Dashboard parameters
```

## Sources

* [API docs](https://ava.antv.vision/en/docs/api/intro)
* [Gallery](https://ava.antv.vision/en/examples/gallery)
* [Wiki](https://github.com/antvis/AVA/wiki)

## Contribution [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

**AVA** is jointly built by multiple core data visualization technology or product teams within Alibaba Group and Ant Group, including **AntV** & **DeepInsight** of Ant Group, **FBI** of New Retail Technology Business Group and **Kanaries** of Freshhema.

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/Qv%24T%24KQJpx/19199542.png" alt="AntV" width="60" align="middle" hspace="20">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/1V8%24AMxRRy/3794630be86d8bb484b9a86f8aead2d1.jpg" alt="DeepInsight" width="180" align="middle" hspace="20">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/dDCkaw%26DcH/TB1HVktD9tYBeNjSspkXXbU8VXa-120-60.svg" alt="FBI" width="100" align="middle" hspace="20">
  <a href="https://github.com/Kanaries"><img src="https://gw.alipayobjects.com/zos/antfincdn/lwdITX3bOY/d398c9ee92e4e79a4ea92e7a24b166fe.jpg" alt="Kanaries" width="180" align="middle" hspace="20"></a>
</div>
<br>

We welcome all contributions. Please read our [Contributing Guide](./CONTRIBUTING.md) first. You can submit any ideas as [pull requests](https://github.com/antvis/AVA/pulls) or as [GitHub issues](https://github.com/antvis/AVA/issues). Let's build a better AVA together.

More at [Wiki: Development](https://github.com/antvis/AVA/wiki/Development).

## Collaboration

<div align="center">
  <a href="https://idvxlab.com/"><img src="https://gw.alipayobjects.com/zos/antfincdn/rxgntN5msN/idvx.png" alt="iDVx" width="140" align="middle" hspace="20"></a>
</div>

## Links

<img src="https://gw.alipayobjects.com/zos/antfincdn/1yMwFkBvyV/chartcube-logo-cube.svg" width="18"> [ChartCube](https://chartcube.alipay.com/) - Online chart making tool based on [G2Plot](https://github.com/antvis/G2Plot).

<img src="https://gw.alipayobjects.com/zos/antfincdn/qxCT7b6aLE/LFooOLwmxGLsltmUjTAP.svg" width="18"> [Kitchen](https://kitchen.alipay.com/) - A suite of plugins to enhance designers.

<img src="https://ch-resources.oss-cn-shanghai.aliyuncs.com/images/kanaries-circular.png" width="18"> [Rath](https://github.com/Kanaries/Rath) - Augmented analytics tool with automated insight discovery and interactive visualization design.
