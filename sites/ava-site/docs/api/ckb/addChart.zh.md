---
title: addChart
order: 3
---

`markdown:docs/common/style.md`



为知识库结构添加一种新的自定义图表类型。

```sign
addChart(chartKnowledge, trans)
```

> deprecated: 不建议使用

## 参数

* **chartKnowledge** * 自定义图表类型的图表知识对象。
  * _必要参数_
  * `参数类型`: *ChartKnowledge* extends object

* **trans** * 自定义图表的特定语言国际化信息。
  * _必要参数_
  * `参数类型`: *Record<Language, TransKnowledgeProps>*

## 返回值

`void`

## 示例

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


