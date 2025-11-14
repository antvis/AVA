---
title: 柱形图
order: 4
redirect_from:
  - /en/docs/api/antv-spec/column
---

## 简介

柱形图是一种数据可视化，其中每个类别由一个矩形表示，矩形的高度与所绘制的值成正比。

## Spec
| 属性       | 类型                                     | 是否必传 | 默认值    | 说明       |
| ---------- | ---------------------------------------- | -------- | --------- | ---------- |
| data       | ColumnDataItem[]                         | 是       | -         | 数据       |
| title      | string                                   | 否       | -         | 图表的标题 |
| axisXTitle | string                                   | 否       | -         | x 轴的标题 |
| axisYTitle | string                                   | 否       | -         | y 轴的标题 |
| theme      | "default" &#124; "dark" &#124; "academy" | 否       | "default" | 图表主题   |
| group      | boolean                                  | 否       | false     | 是否分组   |
| stack      | boolean                                  | 否       | false     | 是否堆叠   |
| style      | IStyle                                   | 否       | -         | 图表样式   |

### ColumnDataItem
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
  "type": "column",
  "data": [
    { "category": "A", "value": 18.9, "group": "G1" },
    { "category": "B", "value": 28.8, "group": "G1" },
    { "category": "A", "value": 12.4, "group": "G2" },
    { "category": "B", "value": 23.2, "group": "G2" }
  ],
  "title": "This is a grouped column chart",
  "axisXTitle": "category",
  "axisYTitle": "value",
  "group": true
}
```
