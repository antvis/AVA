<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> [English](../README.md) | 简体中文

<h1 align="center">
  <p>Chart Knowledge Base (CKB)</p>
  <span style="font-size: 24px;">AVA/knowledge</span>
</h1>

<div align="center">

数据可视化图表知识库

[![Version](https://badgen.net/npm/v/@antv/knowledge)](https://www.npmjs.com/@antv/knowledge)
[![NPM downloads](http://img.shields.io/npm/dm/@antv/knowledge.svg)](http://npmjs.com/@antv/knowledge)

</div>

Chart Knowledge Base (CKB) 是一个提供图表经验的知识库，它的形式基于 JSON。每个图表的知识结构类似这样：

```js
{
  single_line_chart: {
    id: 'single_line_chart',
    name: 'Single Line Chart',
    alias: ['Line', 'Line Chart', 'Basic Line Chart'],
    family: ['LineCharts'],
    def:
      'A single line chart is a chart that uses one line with segments to show changes in data in a ordinal dimension.',
    purpose: ['Trend'],
    coord: ['Cartesian2D'],
    category: ['Statistic'],
    shape: ['Lines'],
    dataPres: [
      { minQty: 1, maxQty: 1, fieldConditions: ['Time', 'Ordinal'] },
      { minQty: 1, maxQty: 1, fieldConditions: ['Interval'] },
    ],
    channel: ['Position', 'Direction'],
  },

  ...
}
```

关于为什么要做 CKB，这篇文章进行了解释：[《AVA/CKB：一次性解决图表命名问题》](https://zhuanlan.zhihu.com/p/110864643)

## 特性

### 图表分类信息的一致性

CKB 希望能解决目前可视化研究环境（特别是中文环境）中概念、术语不统一的问题。降低领域内研究和讨论的沟通成本。

我们基于数据可视化社区来共建一个图表知识库。每个参与者都可以提出自己对于图表的认识。我们会一起讨论来制定图表的名称、定义、分类和各种属性。

### 快速构建图表选择类产品

使用 CKB，你可以快速开发诸如图表类型字典、图表筛选、图表百科之类的产品和应用。比如: <img src="https://gw.alipayobjects.com/zos/antfincdn/1yMwFkBvyV/chartcube-logo-cube.svg" width="18"> [ChartCube](https://chartcube.alipay.com/guide)

<div align="center">
<img src="https://gw.alipayobjects.com/zos/antfincdn/Q70gxQ1Tde/Screen%252520Shot%2525202020-02-18%252520at%2525207.14.29%252520AM.png" width="600" />
</div>

### 智能图表推荐的基石

AVA 的智能图表推荐的能力是以 CKB 为依托的。有了 CKB，你也可以在它的基础上，指定自定义规则，搭建自己的图表推荐系统。

## 安装

```bash
$ npm install @antv/knowledge
```

## 用法

```js
import { CKBJson } from '@antv/knowledge';


// 得到全量的英文图表知识库
const knowledgeBase = CKBJson();

// 得到只包含完整信息的图表构成的中文图表知识库
const zhCompletedKB = CKBJson('zh-CN', true);
```

## 文档

* 更多用法请见 [CKB 简易 API](../API.md)
* 详细[API 文档](../../../docs/api/knowledge.md)
* [用户指南](./USERGUIDE.zh-CN.md)

## 贡献

我们欢迎任何共建。请先阅读 [通用贡献指南](../../../zh-CN/CONTRIBUTING.zh-CN.md) 和 [AVA/CKB 代码贡献指南](./CONTRIBUTING.zh-CN.md)。

欢迎通过 [pull requests](https://github.com/antvis/AVA/pulls) 或 [GitHub issues](https://github.com/antvis/AVA/issues) 向我们提供你的想法。让我们一起来把 AVA 做得更好！

> 强烈推荐阅读 [《提问的智慧》](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way)、[《如何向开源社区提问题》](https://github.com/seajs/seajs/issues/545) 和 [《如何有效地报告 Bug》](http://www.chiark.greenend.org.uk/%7Esgtatham/bugs-cn.html)、[《如何向开源项目提交无法解答的问题》](https://zhuanlan.zhihu.com/p/25795393)，更好的问题更容易获得帮助。

## 证书

MIT

## 友情链接

<img src="https://gw.alipayobjects.com/zos/antfincdn/1yMwFkBvyV/chartcube-logo-cube.svg" width="18"> [ChartCube](https://chartcube.alipay.com/) - 基于 [G2Plot](https://github.com/antvis/G2Plot) 的在线图表制作工具，交互简单，一键导出图表代码！
