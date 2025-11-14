---
title: 直方图
order: 10
redirect_from:
  - /en/docs/api/antv-spec/histogram
---

## 简介

直方图是数值数据分布的近似表示。

## Spec

| 属性       | 类型                                      | 是否必传 | 默认值    | 说明       |
| ---------- | ---------------------------------------- | -------- | --------- | ---------- |
| data       | number[]                                 | 是       | -         | 数据       |
| title      | string                                   | 否       | -         | 图表的标题 |
| axisXTitle | string                                   | 否       | -         | x 轴的标题 |
| axisYTitle | string                                   | 否       | -         | y 轴的标题 |
| theme      | "default" &#124; "dark" &#124; "academy" | 否       | "default" | 图表主题   |
| style      | IStyle                                   | 否       | -         | 图表样式   |

### IStyle

| 属性            | 类型     | 是否必传 | 默认值 | 说明     |
| --------------- | -------- | -------- | ------ | -------- |
| backgroundColor | string   | 否       | -      | 背景颜色 |
| palette         | string[] | 否       | -      | 颜色映射 |

## Spec 示例

```json
{
  "type": "histogram",
  "data": [
    { "value": 1.2 },
    { "value": 3.4 },
    { "value": 2.2 },
    { "value": 4.1 },
    { "value": 3.8 }
  ],
  "title": "This is a histogram",
  "bin": 2
}
```
