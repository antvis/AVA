---
title: 箱线图
order: 3
redirect_from:
  - /en/docs/api/antv-spec/boxplot
---

## 简介

箱线图（又称盒须图）是一种标准化的数据显示方式，它基于五数概括（最小值、第一四分位数 (Q1)、中位数、第三四分位数 (Q3) 和最大值）来展示数据的分布情况。

## Spec
| 属性       | 类型                                     | 是否必传 | 默认值    | 说明       |
| ---------- | ---------------------------------------- | -------- | --------- | ---------- |
| data       | BoxplotDataItem[]                        | 是       | -         | 数据       |
| title      | string                                   | 否       | -         | 图表的标题 |
| axisXTitle | string                                   | 否       | -         | x 轴的标题 |
| axisYTitle | string                                   | 否       | -         | y 轴的标题 |
| title      | string                                   | 否       | -         | 图表的标题 |
| theme      | "default" &#124; "dark" &#124; "academy" | 否       | "default" | 图表主题   |
| style      | IStyle                                   | 否       | -         | 图表样式   |

### BoxplotDataItem
| 属性     | 类型   | 是否必传 | 默认值 | 说明         |
| -------- | ------ | -------- | ------ | ------------ |
| category | string | 是       | -      | 数据分类名称 |
| value    | number | 是       | -      | 数据分类值   |
| group    | number | 否       | -      | 数据分组名称 |

### IStyle
| 属性            | 类型     | 是否必传 | 默认值 | 说明     |
| --------------- | -------- | -------- | ------ | -------- |
| backgroundColor | string   | 否       | -      | 背景颜色 |
| palette         | string[] | 否       | -      | 颜色映射 |

## Spec 示例

```json
{
  "type": "boxplot",
  "data": [
    { "category": "A", "value": 60 },
    { "category": "A", "value": 80 },
    { "category": "B", "value": 20 },
    { "category": "B", "value": 110 }
  ],
  "title": "This is a boxplot",
  "axisXTitle": "category",
  "axisYTitle": "value"
}
```