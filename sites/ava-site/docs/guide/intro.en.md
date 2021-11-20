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

## Demo

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
  <img src="https://gw.alipayobjects.com/zos/antfincdn/QTJPYXJpjW/avademo.gif" width="100%" alt="AVA demo">
</div>

## Packages

### [AVA/CKB](https://github.com/antvis/AVA/tree/master/packages/knowledge)

CKB stands for Chart Knowledge Base. This package is the KB where empirical knowledge about visualization and charts is stored. The chart recommendation is based on it.

At the same time, this package also facilitates us to develop products of chart type selection.


```sign
@antv/knowledge // to get the chart knowledge base
```

### [AVA/DataWizard](https://github.com/antvis/AVA/tree/master/packages/data-wizard)

DataWizard is a js/ts library for data processing. In the AVA framework, it is used to understand and process the input dataset. However, it can also be used independently to develop some data processing, statistics or data mocking functions.

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

LiteInsight is a js/ts library employed for Exploratory Data Analysis (EDA). It can automatically discover data insights from multidimensional data.

```sign
@antv/lite-insight // to get data insight
```

### [AVA/SmartBoard](https://github.com/antvis/AVA/blob/master/packages/smart-board)

SmartBoard is a js/ts library employed for Dashboard visualization of charts. It automatically generates the corresponding Dashboard configurations based on input charts and insights.

```sign
@antv/smart-board // to get Dashboard parameters
```

## Links

<img src="https://gw.alipayobjects.com/zos/antfincdn/1yMwFkBvyV/chartcube-logo-cube.svg" width="18"> [ChartCube](https://chartcube.alipay.com/) - Online chart making tool based on [G2Plot](https://github.com/antvis/G2Plot).

<img src="https://gw.alipayobjects.com/zos/antfincdn/qxCT7b6aLE/LFooOLwmxGLsltmUjTAP.svg" width="18"> [Kitchen](https://kitchen.alipay.com/) - A suite of plugins to enhance designers.

<img src="https://ch-resources.oss-cn-shanghai.aliyuncs.com/images/kanaries-circular.png" width="18"> [Rath](https://github.com/Kanaries/Rath) - Augmented analytics tool with automated insight discovery and interactive visualization design.

