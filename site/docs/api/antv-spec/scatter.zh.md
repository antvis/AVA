---
title: 散点图
order: 6
redirect_from:
  - /zh/docs/api/antv-spec/scatter
---

## 简介

散点图是一种用于展示两个数值变量之间关系的图表，通过在坐标系中绘制数据点来观察变量之间的相关性、分布模式和异常值。

## Spec

| 属性       | 类型                                     | 是否必传 | 默认值    | 说明       |
| ---------- | ---------------------------------------- | -------- | --------- | ---------- |
| type       | string                                  | 是       | -         | 图表类型，固定为 `scatter` |
| data       | ScatterDataItem[]                        | 是       | -         | 数据       |
| title      | string                                   | 否       | -         | 图表的标题 |
| axisXTitle | string                                   | 否       | -         | x 轴的标题 |
| axisYTitle | string                                   | 否       | -         | y 轴的标题 |
| theme      | "default" &#124; "dark" &#124; "academy" | 否       | "default" | 图表主题   |
| style      | IStyle                                   | 否       | -         | 图表样式   |

### ScatterDataItem

| 属性  | 类型   | 是否必传 | 默认值 | 说明             |
| ----- | ------ | -------- | ------ | ---------------- |
| x     | number | 是       | -      | X 轴上的数值变量 |
| y     | number | 是       | -      | Y 轴上的数值变量 |
| group | string | 否       | -      | 数据分组名称     |

### IStyle

| 属性            | 类型     | 是否必传 | 默认值 | 说明     |
| --------------- | -------- | -------- | ------ | -------- |
| backgroundColor | string   | 否       | -      | 背景颜色 |
| palette         | string[] | 否       | -      | 颜色映射 |

## Spec 示例

```json
{
  "type": "scatter",
  "data": [
    { "x": 10, "y": 20 },
    { "x": 15, "y": 25 },
    { "x": 20, "y": 30 },
    { "x": 25, "y": 35 },
    { "x": 30, "y": 25 },
    { "x": 35, "y": 40 },
    { "x": 40, "y": 45 },
    { "x": 45, "y": 35 },
    { "x": 50, "y": 50 },
    { "x": 55, "y": 45 }
  ],
  "title": "散点图示例",
  "axisXTitle": "X轴",
  "axisYTitle": "Y轴",
  "theme": "default"
}
```
