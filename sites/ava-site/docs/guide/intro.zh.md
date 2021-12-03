---
title: AVA 简介
order: 0
redirect_from:
  - /zh/docs/guide
---

<div align="center">
  <img width="200" height="120" src="http://alipay-rmsdeploy-image.cn-hangzhou.alipay.aliyun-inc.com/antfincdn/9LkQDJaV%24%24/logo.svg" alt="AVA logo">
</div>

<div align="center">

<i>智能可视分析框架</i>

</div>

----

<a href="https://ava.antv.vision"><img src="http://alipay-rmsdeploy-image.cn-hangzhou.alipay.aliyun-inc.com/antfincdn/ZIA50SVLax/vectorA.svg" align="left" hspace="10" vspace="6"></a>


**AVA** (A Visual Analytics) 是为了更简便的可视分析而生的技术框架。 其名称中的第一个 **A** 具有多重涵义：它说明了这是一个出自阿里巴巴集团（*Alibaba*）技术框架，其目标是成为一个自动化（*Automated*）、智能驱动（*AI driven*）、支持增强分析（*Augmented*）的可视分析解决方案。

<br />

AVA 的整体架构如下：

<div align="center">
<img src='https://gw.alipayobjects.com/mdn/rms_fabca5/afts/img/A*cmCYSrUks9gAAAAAAAAAAAAAARQnAQ' width="100%" alt='AVA framework' />
</div>

<br />

## 演示案例

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


## 包

### [AVA/AutoChart](https://github.com/antvis/AVA/blob/master/packages/auto-chart/zh-CN/README.zh-CN.md)

AutoChart 是一个可以根据数据自动推荐合适的图表并渲染的 React 组件。它可以为用户提供一行代码实现智能可视化的能力。

```sign
@antv/auto-chart // 一键可视化组件
```

### [AVA/CKB](https://github.com/antvis/AVA/blob/master/packages/auto-chart/zh-CN/README.zh-CN.md)

CKB 的意思是 Chart Knowledge Base，也就是图表知识库。这个包中包含了基于经验总结的关于可视化和图表的各种基本知识和观察。图表的推荐必须基于这些基本概念。

同时，这个包也让开发图表类型筛选相关的产品变得非常简单。

```sign
@antv/knowledge // 图表知识库
```

### [AVA/DataWizard](https://github.com/antvis/AVA/blob/master/packages/data-wizard/zh-CN/README.zh-CN.md)

DataWizard 是一个基于 js/ts 的前端数据处理库。在 AVA 的框架中，它被用来理解和处理输入端的数据集。不过，它也可以独立地被用来开发一些数据处理、数学统计、数据模拟之类的功能。

```sign
import { DataFrame } from @antv/data-wizard // 数据处理模块
import { statistics } from @antv/data-wizard // 数学统计模块
import { random } from @antv/data-wizard // 数据模拟模块
```

### [AVA/ChartAdvisor](https://github.com/antvis/AVA/blob/master/packages/chart-advisor/zh-CN/README.zh-CN.md)

ChartAdvisor 是 AVA 的核心部分。它基于数据和分析需求来推荐图表类型和具体的图表细节设置。

```sign
@antv/chart-advisor // 图表推荐和自动生成
```

### [AVA/LiteInsight](https://github.com/antvis/AVA/blob/master/packages/lite-insight/zh-CN/README.zh-CN.md)

LiteInsight 是一个用于探索性数据分析的 js/ts 工具库，它可以从多维数据中自动地发现数据洞察。

```sign
@antv/lite-insight // 数据洞察库
```

### [AVA/SmartBoard](https://github.com/antvis/AVA/blob/master/packages/smart-board/zh-CN/README.zh-CN.md)

SmartBoard 是一个用于 Dashboard 数据展示的 js/ts 工具库。它根据输入图表和洞察自动生成对应的 Dashboard。

```sign
@antv/smart-board // 增强展现库
```

### [AVA/SmartColor](https://github.com/antvis/smart-color)

SmartColor 是一个 js/ts 的前端颜色处理类库。它可以深度定制色板模式，对已有色板进行颜色优化和色彩校正，并且可以一键适配色盲场景。

```sign
@antv/smart-color // 智能色板库
```
## 友情链接

<img src="https://gw.alipayobjects.com/zos/antfincdn/1yMwFkBvyV/chartcube-logo-cube.svg" width="18"> [ChartCube](https://chartcube.alipay.com/) - 基于 [G2Plot](https://github.com/antvis/G2Plot) 的在线图表制作工具，交互简单，一键导出图表代码！

<img src="https://gw.alipayobjects.com/zos/antfincdn/qxCT7b6aLE/LFooOLwmxGLsltmUjTAP.svg" width="18"> [Kitchen](https://kitchen.alipay.com/) - 为设计者提升工作效率的工具集。

<img src="https://ch-resources.oss-cn-shanghai.aliyuncs.com/images/kanaries-circular.png" width="18"> [Rath](https://github.com/Kanaries/Rath) - 支持洞察自动发现与交互式可视化(图表、报表)生成推荐的增强分析工具。

## 升级指南（从 v1 到 v2）

* `@antv/knowledge` 更名为 `@antv/ckb`，基本使用不变；
* `@antv/dw-*` 系列（包括 `@antv/dw-analyzer`、`@antv/dw-transform`、`@antv/dw-random`、`@antv/dw-util`）统一为 `@antv/data-wizard`，并升级数据格式，具体详情见 [DataWizard](https://ava.antv.vision/zh/docs/guide/data-wizard/intro)；
* `@antv/chart-advisor`，主要变更点有以下两点，具体详情见 [ChartAdvisor](https://ava.antv.vision/zh/docs/guide/chart-advisor/ChartAdvisor)
  * 结合原 `@antv/chart-linter` 能力，`@antv/chart-linter` 将不再维护；
  * 不再导出 `autoChart` 方法，`autoChart` 升级为 react 组件，可以过 `@antv/auto-chart` 引用，且不再支持配置面板，具体详情见 [AutoChart API](https://ava.antv.vision/zh/docs/api/auto-chart/AutoChart)。
