---
title: ckb
order: 1
---

<embed src='@/docs/common/style.md'></embed>


Creates a **Chart Knowledge Base** object.

```sign
ckb(ckbCfg?: CkbConfig): ChartKnowledgeBase
```

## Parameters

* **ckbCfg** * CKB Configuration.
  * _optional_
  * `type`: _CkbConfig_
  * `default`: None

* _**CkbConfig**_ CKB Configuration.

Configuration to pick, omit and customize CKB.
Priority: exclude > include, + custom.

| Properties | Type                             | Description                                                                      | Default         |
| ---------- | -------------------------------- | -------------------------------------------------------------------------------- | --------------- |
| exclude    | `string[]`                       | Specify to exclude standard charts.                                              | None `Optional` |
| include    | `string[]`                       | Specify to only include these standard charts, with lower priority than exclude. | None `Optional` |
| custom     | `Record<string, ChartKnowledge>` | Customized charts.                                                               | None `Optional` |

* [_**ChartKnowledge**_](../types/ckb#ChartKnowledge)

## Return value

_ChartKnowledgeBase_ extends object

TS type of CKB(Chart Knowledge Base).
Could be in any language or contain custom chart types.

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

## Examples

### Get standard CKB

```js
import { ckb } from '@antv/ava';


const myCkb = ckb();
```

### Exclude some standard charts

To get a chart knowledge base that does not contain pie chart.

```js
const myCkb = ckb({ exclude: ['pie_chart'] });
```

### Contains only certain standard charts

To get a  chart knowledge base containing only line chart and pie chart.

```js
const myCkb = ckb({ include: ['line_chart', 'pie_chart'] });
```

### Add custom charts

Add a custom chart type to the standard chart knowledge base.

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

### Composite configurations

The following configuration:

* Pie chart are first removed from the standard CKB.
* Then select only the line chart and pie chart from the above CKB, i.e. only the line charts are left.
* Add a custom "Neo Chart" to the above CKB. The resulting CKB contains 2 types of chart: line chart and "Neo chart".

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

### Contains only custom charts

`include` is an empty array, which means that no charts are selected from the standard CKB. After that, if you add any number of custom charts, the resulting chart knowledge base will contain only these custom charts.

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
