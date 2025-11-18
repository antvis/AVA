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
| type       | string                                  | 是       | -         | 图表类型，固定为 `dual-axes` |
| categories | string[]                                 | 是       | -         | 分类       |
| series     | SeriesDataItem[]                         | 是       | -         | 系列       |
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
  "categories": ["一月", "二月", "三月", "四月", "五月", "六月"],
  "series": [
    {
      "type": "column",
      "data": [120, 132, 101, 134, 90, 230],
      "axisYTitle": "销售额 (美元)"
    },
    {
      "type": "line",
      "data": [820, 932, 901, 934, 1290, 1330],
      "axisYTitle": "收入 (美元)"
    }
  ],
  "title": "2024年上半年销售额与收入对比",
  "axisXTitle": "月份",
  "theme": "default",
  "style": {
    "backgroundColor": "#ffffff",
    "palette": ["#5B8FF9", "#5AD8A6"],
    "lineWidth": 2
  }
}
```
