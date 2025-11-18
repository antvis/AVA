---
title: 小提琴图
order: 17
redirect_from:
  - /zh/docs/api/antv-spec/violin
---

## 简介

小提琴图是一种用于展示数据分布的统计图表，结合了箱线图和密度图的特点，能够显示数据的概率密度分布情况。

## Spec

| 属性       | 类型                                     | 是否必传 | 默认值    | 说明       |
| ---------- | ---------------------------------------- | -------- | --------- | ---------- |
| type       | `string`                                  | 是       | -         | 图表类型，固定为 `violin` |
| data       | ViolinDataItem[]                         | 是       | -         | 数据       |
| title      | string                                   | 否       | -         | 图表的标题 |
| axisXTitle | string                                   | 否       | -         | x 轴的标题 |
| axisYTitle | string                                   | 否       | -         | y 轴的标题 |
| theme      | "default" &#124; "dark" &#124; "academy" | 否       | "default" | 图表主题   |
| style      | IStyle                                   | 否       | -         | 图表样式   |

### ViolinDataItem

| 属性     | 类型   | 是否必传 | 默认值 | 说明         |
| -------- | ------ | -------- | ------ | ------------ |
| category | string | 是       | -      | 数据分类名称 |
| value    | number | 是       | -      | 数据分类值   |
| group    | string | 否       | -      | 数据分组名称 |

### IStyle

| 属性            | 类型     | 是否必传 | 默认值 | 说明     |
| --------------- | -------- | -------- | ------ | -------- |
| backgroundColor | string   | 否       | -      | 背景颜色 |
| palette         | string[] | 否       | -      | 颜色映射 |

## Spec 示例

```json
{
  "type": "violin",
  "data": [
    { "category": "组A", "value": 25 },
    { "category": "组A", "value": 30 },
    { "category": "组A", "value": 35 },
    { "category": "组B", "value": 20 },
    { "category": "组B", "value": 25 },
    { "category": "组B", "value": 40 },
    { "category": "组C", "value": 15 },
    { "category": "组C", "value": 35 },
    { "category": "组C", "value": 45 }
  ],
  "title": "小提琴图示例",
  "axisXTitle": "分类",
  "axisYTitle": "数值",
  "theme": "default"
}
```
