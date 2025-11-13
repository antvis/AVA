---
title: 双轴图
order: 5
redirect_from:
  - /en/docs/api/antv-spec/dual-axes
---

## 简介

双轴图允许在同一个图表上可视化两个不同的数据系列，使用两个独立的 Y 轴。

## Spec
| 属性       | 类型                                     | 是否必传 | 默认值    | 说明       |
| ---------- | ---------------------------------------- | -------- | --------- | ---------- |
| data       | DualAxesDataItem[]                       | 是       | -         | 数据       |
| title      | string                                   | 否       | -         | 图表的标题 |
| axisXTitle | string                                   | 否       | -         | x 轴的标题 |
| axisYTitle | string                                   | 否       | -         | y 轴的标题 |
| theme      | "default" &#124; "dark" &#124; "academy" | 否       | "default" | 图表主题   |
| style      | IStyle                                   | 否       | -         | 图表样式   |

### SeriesDataItem
| 属性       | 类型     | 是否必传 | 默认值 | 说明         |
| ---------- | -------- | -------- | ------ | ------------ |
| type       | string   | 是       | -      | 子图表类型   |
| data       | number[] | 是       | -      | 子图表数据   |
| axisYTitle | string   | 否       | -      | Y 轴标题     |

### IStyle
| 属性            | 类型     | 是否必传 | 默认值 | 说明           |
| --------------- | -------- | -------- | ------ | -------------- |
| backgroundColor | string   | 否       | -      | 背景颜色       |
| palette         | string[] | 否       | -      | 颜色映射       |
| lineWidth       | number   | 否       | -      | 图形描边的宽度 |

## Spec 示例

```json
{
  "type": "dual-axes",
  "data": [
    { "time": "Jan.", "value": 18.9, "series": "value" },
    { "time": "Feb.", "value": 28.8, "series": "value" },
    { "time": "Jan.", "value": 12.4, "series": "count" },
    { "time": "Feb.", "value": 23.2, "series": "count" }
  ],
  "title": "This is a dual-axes chart",
  "axisXTitle": "time",
  "series": [
    {
      "type": "column",
      "series": "value",
      "axisYTitle": "value"
    },
    {
      "type": "line",
      "series": "count",
      "axisYTitle": "count"
    }
  ]
}
```