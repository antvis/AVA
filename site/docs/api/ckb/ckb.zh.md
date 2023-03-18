---
title: ckb
order: 1
---

<embed src='@/docs/common/style.md'></embed>


得到一个 **图表知识库（Chart Knowledge Base）** 对象，以下简称 CKB。

```sign
ckb(ckbCfg?: CkbConfig): ChartKnowledgeBase
```

## 参数

* **ckbCfg** * CKB 配置。
  * _可选参数_
  * `参数类型`: _CkbConfig_
  * `默认值`: 无

* _**CkbConfig**_ 图表知识库参数配置。

用来摘选、剔除和自定义 CKB 的配置。
优先级逻辑是：先从原装 CKB 中剔除`exclude`的部分，然后在剩余的图表类型中摘选出`include`的部分，最后额外加上自定义的图表类型。

| 属性    | 类型                             | 描述                                     | 默认值     |
| ------- | -------------------------------- | ---------------------------------------- | ---------- |
| exclude | `string[]`                       | 从标准 CKB 中剔除的图表。                | 无  `可选` |
| include | `string[]`                       | 只包含某些标准图表，优先级低于 exclude。 | 无  `可选` |
| custom  | `Record<string, ChartKnowledge>` | 自定义图表。                             | 无  `可选` |

* [_**ChartKnowledge**_](../types/ckb#ChartKnowledge)


## 返回值

_ChartKnowledgeBase_ extends object

整个图表知识库（CKB）的 TS 类型，可能是不同语言版本以及可以带自定义图表类型

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

## 示例

### 得到标准 CKB

```js
import { ckb } from '@antv/ava';


const myCkb = ckb();
```

### 剔除某些标准图表

想要一个不包含饼图的图表知识库。

```js
const myCkb = ckb({ exclude: ['pie_chart'] });
```

### 只包含某些标准图表

想要一个只包含折线图、饼图的图表知识库。

```js
const myCkb = ckb({ include: ['line_chart', 'pie_chart'] });
```

### 增加自定义图表

在标准图表知识库的基础上，加一个自定义的图表类型。

```js
const neoDiagram = {
  id: 'neo_diagram',
  name: 'Neo Diagram',
  alias: ['Neo Chart'],
  family: ['Others'],
  def: 'A magic chart invented by Neo.',
  purpose: ['Comparison'],
  coord: [],
  category: ['Diagram'],
  shape: ['Lines'],
  dataPres: [{ minQty: 1, maxQty: 1, fieldConditions: ['Interval'] }],
  channel: ['Position'],
  recRate: 'Not Recommend',
};

const myCkb = ckb({
  custom: {
    neo_diagram: neoDiagram,
  },
});
```

### 复合的配置情况

以下配置方式：

* 先从标准 CKB 中剔除饼图。
* 再从上述 CKB 中只选出折线图和饼图，也就是只剩下折线图了。
* 再往上述 CKB 中加入自定义的“Neo 图”。最终得到的 CKB 包含 2 种图表类型：折线图、“Neo 图”。

```js
const neoDiagram = {
  id: 'neo_diagram',
  name: 'Neo Diagram',
  alias: ['Neo Chart'],
  family: ['Others'],
  def: 'A magic chart invented by Neo.',
  purpose: ['Comparison'],
  coord: [],
  category: ['Diagram'],
  shape: ['Lines'],
  dataPres: [{ minQty: 1, maxQty: 1, fieldConditions: ['Interval'] }],
  channel: ['Position'],
  recRate: 'Not Recommend',
};

const myCkb = ckb({
  exclude: ['pie_chart'],
  include: ['line_chart', 'pie_chart'],
  custom: {
    neo_diagram: neoDiagram,
  },
});
```

### 只包含自定义图表

`include` 为空数组，表示不从标准 CKB 中选出任何图表。此时再增加任意个数的自定义图表，得到的图表知识库中只包含自定义图表。

```js
const neoDiagram = {
  id: 'neo_diagram',
  name: 'Neo Diagram',
  alias: ['Neo Chart'],
  family: ['Others'],
  def: 'A magic chart invented by Neo.',
  purpose: ['Comparison'],
  coord: [],
  category: ['Diagram'],
  shape: ['Lines'],
  dataPres: [{ minQty: 1, maxQty: 1, fieldConditions: ['Interval'] }],
  channel: ['Position'],
  recRate: 'Not Recommend',
};

const myCkb = ckb({
  include: [],
  custom: {
    neo_diagram: neoDiagram,
  },
});
```
