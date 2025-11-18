---
title: 饼图
order: 17
---

## 简介
饼图是一种圆形统计图表，将数据表示为整个圆的各个扇形，用于显示各个类别在总体中的占比关系。每个扇形的角度大小与其所代表的数值成正比，整个饼图代表数据的总和。饼图特别适合展示分类数据的占比关系，可以直观地展示各个部分在整体中的相对重要性。通过不同颜色的扇形区分各个类别，使得比较各类别的占比变得简单直观。

## Spec

| 属性  | 类型                                     | 是否必传 | 默认值    | 说明       |
| ----- | ---------------------------------------- | -------- | --------- | ---------- |
| type  | string                                  | 是       | -         | 图表类型，固定为 `pie` |
| data  | PieDataItem[]                            | 是       | -         | 数据       |
| title | string                                   | 否       | -         | 图表的标题 |
| innerRadius | number                                   | 否       | -         | 内半径；设置为创建donut图表 |
| theme | "default" &#124; "dark" &#124; "academy" | 否       | "default" | 图表主题   |
| style | IStyle                                   | 否       | -         | 图表样式   |

### IStyle

| 属性            | 类型     | 是否必传 | 默认值 | 说明           |
| --------------- | -------- | -------- | ------ | -------------- |
| backgroundColor | string   | 否       | -      | 背景颜色       |
| palette         | string[] | 否       | -      | 颜色映射       |
| lineWidth       | number   | 否       | -      | 图形描边的宽度 |

### PieDataItem

| 属性     | 类型   | 是否必传 | 默认值 | 说明           |
| -------- | ------ | -------- | ------ | -------------- |
| category | string | 是       | -      | 扇形区域的名称 |
| value    | number | 是       | -      | 扇形区域的值   |

## Spec 示例
```json
{
  "type": "pie",
  "title": "My Pie Chart",
  "innerRadius": 0.6,
  "theme": "dark",
  "style": {
    "backgroundColor": "#222",
    "palette": ["#ff6b6b", "#f06595", "#cc5de8", "#845ef7", "#5c7cfa", "#339af0", "#22b8cf", "#20c997", "#51cf66", "#94d82d"],
    "lineWidth": 2
  },
  "data": [
    { "category": "Category A", "value": 27 },
    { "category": "Category B", "value": 25 },
    { "category": "Category C", "value": 18 },
    { "category": "Category D", "value": 15 },
    { "category": "Category E", "value": 10 },
    { "category": "Other", "value": 5 }
  ]
}
```
