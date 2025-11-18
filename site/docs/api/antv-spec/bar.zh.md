---
title: 条形图
order: 2
redirect_from:
  - /en/docs/api/antv-spec/bar
---

## 简介

条形图或条形图是一种图表或图形，用矩形条表示分类数据，其高度或长度与它们所代表的值成比例。条形图可以垂直或水平绘制。

## Spec
| 属性       | 类型                                     | 是否必传 | 默认值    | 说明       |
| ---------- | ---------------------------------------- | -------- | --------- | ---------- |
| data       | BarDataItem[]                            | 是       | -         | 数据       |
| title      | string                                   | 否       | -         | 图表的标题 |
| axisXTitle | string                                   | 否       | -         | x 轴的标题 |
| axisYTitle | string                                   | 否       | -         | y 轴的标题 |
| group      | boolean                                  | 否       | false     | 是否分组   |
| stack      | boolean                                  | 否       | false     | 是否堆叠   |
| theme      | "default" &#124; "dark" &#124; "academy" | 否       | "default" | 图表主题   |
| style      | IStyle                                   | 否       | -         | 图表样式   |

### BarDataItem
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
  "type": "bar",
  "data": [
    { "category": "A", "value": 18.9, "group": "G1" },
    { "category": "B", "value": 28.8, "group": "G1" },
    { "category": "A", "value": 12.4, "group": "G2" },
    { "category": "B", "value": 23.2, "group": "G2" }
  ],
  "title": "This is a grouped bar chart",
  "axisXTitle": "category",
  "axisYTitle": "value",
  "group": true
}
```
