---
title: CKB 简介
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

Chart Knowledge Base (CKB) 是一个提供图表经验的知识库，它的形式基于 JSON。

每个图表的知识结构类似这样：

```js
{
  line_chart: {
    id: 'line_chart',
    name: 'Line Chart',
    alias: ['Lines'],
    family: ['LineCharts'],
    def: 'A line chart uses lines with segments to show changes in data in a ordinal dimension.',
    purpose: ['Comparison', 'Trend', 'Anomaly'],
    coord: ['Cartesian2D'],
    category: ['Statistic'],
    shape: ['Lines'],
    dataPres: [
      { minQty: 1, maxQty: 1, fieldConditions: ['Time', 'Ordinal'] },
      { minQty: 0, maxQty: 1, fieldConditions: ['Nominal'] },
      { minQty: 1, maxQty: 1, fieldConditions: ['Interval'] },
    ],
    channel: ['Position', 'Direction'],
    recRate: 'Recommended',
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

</div>
