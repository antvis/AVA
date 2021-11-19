---
title: addChart
order: 3
---

`markdown:docs/common/style.md`



Adds a custom chart to the base.

```sign
addChart(chartKnowledge, trans)
```

> deprecated

## Parameters

* **chartKnowledge** * Chart Knowledge object for the custom chart.
  * _required_
  * `type`: *ChartKnowledge* extends object

* **trans** * Object for i18n translation.
  * _required_
  * `type`: *Record<Language, TransKnowledgeProps>*

## Return value

`void`

## Examples

```ts
const liquid_diagram = {
  id: 'liquid_diagram',
  name: 'Liquid Diagram',
  alias: ['Liquid Chart'],
  family: ['Others'],
  def: 'A liquid diagram is a infographic for presenting progress.',
  purpose: ['Comparison'],
  coord: [],
  category: ['Diagram'],
  shape: ['Lines'],
  dataPres: [{ minQty: 1, maxQty: 1, fieldConditions: ['Interval'] }],
  channel: ['Position'],
};

const liquid_diagram_trans = {
  name: '水波图',
  alias: ['水波球', '进度球'],
  def: '水波图是一种用球形容器和其中的水平线位置来表示进度的示意图。',
};

addChart(
  liquid_diagram as ChartKnowledge,
  { 'zh-CN': liquid_diagram_trans } as Record<Language, TransKnowledgeProps>
);
```


