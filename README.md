<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> English | [简体中文](./zh-CN/README.zh-CN.md)

<div align="center">
  <img width="200" height="120" src="./common/img/logo.svg" alt="AVA logo">
</div>

<div align="center">

<i>A framework for automated visual analytics.</i>

</div>

----

<a href="https://d3js.org"><img src="./common/img/vectorA.svg" align="left" hspace="10" vspace="6"></a>

**AVA** (![AVA logo](./common/img/vectorASymbol.svg) Visual Analytics) is a framework (or a solution) for more convenient visual analytics. The first **A** of AVA  has many meanings. It states that this framework is from *Alibaba*, and its goal is to become an *Automated*, *AI driven* solution that supports *Augmented* analytics.

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
  <img src="https://gw.alipayobjects.com/zos/antfincdn/QTJPYXJpjW/avademo.gif" alt="AVA demo">
</div>

## Packages

### 📦 [AVA/CKB](./packages/knowledge/README.md)

CKB stands for Chart Knowledge Base. This package is the KB where empirical knowledge about visualization and charts is stored. The chart recommendation is based on it.

At the same time, this package also facilitates us to develop products of chart type selection.


```js
@antv/knowledge
```

### 📦 AVA/DataWizard

DataWizard is a js/ts library for data processing. In the AVA framework, it is used to 'understand' the input dataset. However, it can also be used independently to develop some statistical or data mocking functions.

### 📦 AVA/ChartAdvisor

ChartAdvisor is the core component of AVA. It recommends charts based on dataset and analysis needs.

## Resources

- [API Reference](API.md)
- [Examples](EXAMPLES.md)
- [Wiki](https://github.com/antvis/AVA/wiki)

## Contribution

**AVA** is jointly built by multiple core data visualization technology or product teams within Alibaba Group, including **AntV** & **DeepInsight** of Ant Financial, **FBI** of New Retail Technology Business Group and **Kanaries** of Freshhema.

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/Qv%24T%24KQJpx/19199542.png" alt="AntV" width="60" align="middle" hspace="20">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/1V8%24AMxRRy/3794630be86d8bb484b9a86f8aead2d1.jpg" alt="DeepInsight" width="180" align="middle" hspace="20">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/dDCkaw%26DcH/TB1HVktD9tYBeNjSspkXXbU8VXa-120-60.svg" alt="FBI" width="100" align="middle" hspace="20">
  <a href="https://github.com/Kanaries"><img src="https://gw.alipayobjects.com/zos/antfincdn/lwdITX3bOY/d398c9ee92e4e79a4ea92e7a24b166fe.jpg" alt="Kanaries" width="180" align="middle" hspace="20"></a>
</div>

## Links

<img src="https://gw.alipayobjects.com/zos/antfincdn/1yMwFkBvyV/chartcube-logo-cube.svg" width="18"> [ChartCube](https://chartcube.alipay.com/) - Online chart making tool based on [G2Plot](https://github.com/antvis/G2Plot).

<img src="https://gw.alipayobjects.com/zos/antfincdn/qxCT7b6aLE/LFooOLwmxGLsltmUjTAP.svg" width="18"> [Kitchen](https://kitchen.alipay.com/) - A suite of plugins to enhance designers.

<img src="https://ch-resources.oss-cn-shanghai.aliyuncs.com/images/kanaries-circular.png" width="18"> [Rath](https://github.com/Kanaries/Rath) - Augmented analytics tool with automated insight discovery and interactive visualization design.
