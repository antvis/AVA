<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> [English](../README.md) | 简体中文

<div align="center">
  <img width="200" height="120" src="../common/img/logo.svg" alt="AVA logo">
</div>

<div align="center">

<i>智能可视分析框架</i>

</div>

----

<a href="https://d3js.org"><img src="../common/img/vectorA.svg" align="left" hspace="10" vspace="6"></a>

**AVA** (![AVA logo](../common/img/vectorASymbol.svg) Visual Analytics) 是为了更简便的可视分析而生的技术框架。 其名称中的第一个 **A** 具有多重涵义：它说明了这是一个出自阿里巴巴集团（*Alibaba*）技术框架，其目标是成为一个自动化（*Automated*）、智能驱动（*AI driven*）、支持增强分析（*Augmented*）的可视分析解决方案。

<br />

## 演示案例

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

## 包

### 📦 [AVA/CKB](../packages/knowledge/zh-CN/README.zh-CN.md)

CKB 的意思是 Chart Knowledge Base，也就是图表知识库。这个包中包含了基于经验总结的关于可视化和图表的各种基本知识和观察。图表的推荐必须基于这些基本概念。

同时，这个包也让开发图表类型筛选相关的产品变得非常简单。

```js
@antv/knowledge
```

### 📦 [AVA/DataWizard](../packages/datawizard/zh-CN/README.zh-CN.md)

DataWizard 是一个 js/ts 的前端数据处理类库。在 AVA 的框架中，它被用来“理解”输入端的数据集。不过，它也可以独立地被用来开发一些数学统计、数据模拟之类的功能。

```js
@antv/dw-analyzer // to understand a dataset
@antv/dw-random // to generate random mock data
```

### 📦 AVA/ChartAdvisor

ChartAdvisor 是 AVA 的核心部分。它基于数据和分析需求来推荐图表类型和具体的图表细节设置。

## 资源

* [API 接口文档](../docs/api/index.md)
* [`autoChart` 临时接口文档](API.zh-CN.md)
* [教程示例](EXAMPLES.zh-CN.md)
* [Wiki 百科](https://github.com/antvis/AVA/wiki)

## 贡献

**AVA** 由蚂蚁金服 **AntV** & **DeepInsight**、新零售技术事业群 **FBI**、盒马 **Kanaries** 等阿里巴巴集团内多个核心数可视化技术和产品团队联合共建。

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/Qv%24T%24KQJpx/19199542.png" alt="AntV" width="60" align="middle" hspace="20">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/1V8%24AMxRRy/3794630be86d8bb484b9a86f8aead2d1.jpg" alt="DeepInsight" width="180" align="middle" hspace="20">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/dDCkaw%26DcH/TB1HVktD9tYBeNjSspkXXbU8VXa-120-60.svg" alt="FBI" width="100" align="middle" hspace="20">
  <a href="https://github.com/Kanaries"><img src="https://gw.alipayobjects.com/zos/antfincdn/lwdITX3bOY/d398c9ee92e4e79a4ea92e7a24b166fe.jpg" alt="Kanaries" width="180" align="middle" hspace="20"></a>
</div>
<br>

我们欢迎任何共建。请先阅读 [贡献指南](./CONTRIBUTING.zh-CN.md)。欢迎通过 [pull requests](https://github.com/antvis/AVA/pulls) 或 [GitHub issues](https://github.com/antvis/AVA/issues) 向我们提供你的想法。让我们一起来把 AVA 做得更好！

> 强烈推荐阅读 [《提问的智慧》](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way)、[《如何向开源社区提问题》](https://github.com/seajs/seajs/issues/545) 和 [《如何有效地报告 Bug》](http://www.chiark.greenend.org.uk/%7Esgtatham/bugs-cn.html)、[《如何向开源项目提交无法解答的问题》](https://zhuanlan.zhihu.com/p/25795393)，更好的问题更容易获得帮助。

## 友情链接

<img src="https://gw.alipayobjects.com/zos/antfincdn/1yMwFkBvyV/chartcube-logo-cube.svg" width="18"> [ChartCube](https://chartcube.alipay.com/) - 基于 [G2Plot](https://github.com/antvis/G2Plot) 的在线图表制作工具，交互简单，一键导出图表代码！

<img src="https://gw.alipayobjects.com/zos/antfincdn/qxCT7b6aLE/LFooOLwmxGLsltmUjTAP.svg" width="18"> [Kitchen](https://kitchen.alipay.com/) - 为设计者提升工作效率的工具集。

<img src="https://ch-resources.oss-cn-shanghai.aliyuncs.com/images/kanaries-circular.png" width="18"> [Rath](https://github.com/Kanaries/Rath) - 支持洞察自动发现与交互式可视化(图表、报表)生成推荐的增强分析工具。
