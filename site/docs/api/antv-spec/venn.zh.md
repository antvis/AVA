---
title: 韦恩图
order: 15
redirect_from:
  - /zh/docs/api/antv-spec/venn
---

## 简介

韦恩图是一种用于展示集合之间关系的图表，通过重叠的圆形区域来表示不同集合的交集、并集和差集。

## Spec

| 属性  | 类型                                     | 是否必传 | 默认值    | 说明       |
| ----- | ---------------------------------------- | -------- | --------- | ---------- |
| type  | string                                 | 是       | -         | 图表类型，固定为 `venn` |
| data  | VennDataItem[]                           | 是       | -         | 数据       |
| title | string                                   | 否       | -         | 图表的标题 |
| theme | "default" &#124; "dark" &#124; "academy" | 否       | "default" | 图表主题   |
| style | IStyle                                   | 否       | -         | 图表样式   |

### VennDataItem

| 属性  | 类型     | 是否必传 | 默认值 | 说明         |
| ----- | -------- | -------- | ------ | ------------ |
| sets  | string[] | 是       | -      | 维恩图的集合 |
| value | number   | 是       | -      | 维恩图的值   |
| label | string   | 否       | -      | 维恩图的标签 |

### IStyle

| 属性            | 类型     | 是否必传 | 默认值 | 说明     |
| --------------- | -------- | -------- | ------ | -------- |
| backgroundColor | string   | 否       | -      | 背景颜色 |
| palette         | string[] | 否       | -      | 颜色映射 |

## Spec 示例

```json
{
  "type": "venn",
  "data": [
    { "sets": ["A"], "value": 10, "label": "集合A" },
    { "sets": ["B"], "value": 10, "label": "集合B" },
    { "sets": ["C"], "value": 10, "label": "集合C" },
    { "sets": ["A", "B"], "value": 2 },
    { "sets": ["A", "C"], "value": 2 },
    { "sets": ["B", "C"], "value": 2 },
    { "sets": ["A", "B", "C"], "value": 1 }
  ],
  "title": "韦恩图示例",
  "theme": "default"
}
```
