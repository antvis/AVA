---
title: AVA Introduction
order: 0
redirect_from:
  - /en/docs/guide
---

<div align="center">
  <img width="200" height="120" src="http://alipay-rmsdeploy-image.cn-hangzhou.alipay.aliyun-inc.com/antfincdn/9LkQDJaV%24%24/logo.svg" alt="AVA logo">
</div>

<div align="center">

<i>A framework for automated visual analytics.</i>

</div>

----

<a href="https://ava.antv.vision"><img src="http://alipay-rmsdeploy-image.cn-hangzhou.alipay.aliyun-inc.com/antfincdn/ZIA50SVLax/vectorA.svg" align="left" hspace="10" vspace="6"></a>

**AVA** is a framework (or a solution) for more convenient **Visual Analytics**. The first **A** of AVA  has many meanings. It states that this framework is from *Alibaba*, and its goal is to become an *Automated*, *AI driven* solution that supports *Augmented* analytics.

<br />

The framework of AVA can be illustrated as follows:

<div align="center">
<img src='https://gw.alipayobjects.com/mdn/rms_fabca5/afts/img/A*cmCYSrUks9gAAAAAAAAAAAAAARQnAQ' width="100%" alt='AVA framework' />
</div>

<br />

## Demo

```html
<div id="mountNode"></div>
```

```js
import { AutoChart } from '@antv/auto-chart';

const data = [
  {field1: 'a', field2: '100'},
  {field1: 'b', field2: '300'},
  {field1: 'c', field2: '800'},
];

ReactDOM.render(
  <>
    <AutoChart 
      title="CASE 1" 
      description="auto chart analysis" 
      data={data} 
      language={'zh-CN'} 
    />
  </>,
  mountNode,
);
```

<br>

<playground path="components/auto-chart/demo/basic.jsx"></playground>


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

### [AVA/SmartColor](https://github.com/antvis/smart-color)

SmartColor is a js/ts color processing class library.
It allows deep customization of swatch patterns, color optimization and color correction of existing swatches, and one-click adaptation to color-blind scenes.

```sign
@antv/smart-color // to generate and customized color and palette.
```

## Links

<img src="https://gw.alipayobjects.com/zos/antfincdn/1yMwFkBvyV/chartcube-logo-cube.svg" width="18"> [ChartCube](https://chartcube.alipay.com/) - Online chart making tool based on [G2Plot](https://github.com/antvis/G2Plot).

<img src="https://gw.alipayobjects.com/zos/antfincdn/qxCT7b6aLE/LFooOLwmxGLsltmUjTAP.svg" width="18"> [Kitchen](https://kitchen.alipay.com/) - A suite of plugins to enhance designers.

<img src="https://ch-resources.oss-cn-shanghai.aliyuncs.com/images/kanaries-circular.png" width="18"> [Rath](https://github.com/Kanaries/Rath) - Augmented analytics tool with automated insight discovery and interactive visualization design.

## Upgrade Guide (v1 to v2)

* `@antv/knowledge` changed to `@antv/ckb`, basic usage remains the same;
* The `@antv/dw-*` series (including `@antv/dw-analyzer`, `@antv/dw-transform`, `@antv/dw-random` and `@antv/dw-util`) is unified as  `@antv/data-wizard`, and the data format is upgraded as detailed in [DataWizard](https://ava.antv.vision/zh/docs/guide/data-wizard/intro);
* `@antv/chart-advisor`, the two main change points are as follows, see  [ChartAdvisor](https://ava.antv.vision/zh/docs/guide/chart-advisor/ChartAdvisor) for details
  * Combined with the former capability of `@antv/chart-linter`, `@antv/chart-linter` will no longer be maintained;
  * The `autoChart` method is no longer exported, `autoChart` is upgraded to a react component that can be referenced by `@antv/auto-chart`, and the configuration panel is no longer supported, see [AutoChart API](https://ava.antv.vision/zh/docs/api/auto-chart/AutoChart) for details.
