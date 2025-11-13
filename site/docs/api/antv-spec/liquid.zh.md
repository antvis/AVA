---
title: 水波图
order: 12
---

## 简介

水波图用于显示一个数量的百分比。

## Spec

| 属性    | 类型                                                  | 是否必传 | 默认值    | 说明       |
| ------- | ----------------------------------------------------- | -------- | --------- | ---------- |
| percent | number                                                | 是       | -         | 百分比     |
| shape   | "rect" &#124; "circle" &#124; "pin" &#124; "triangle" | 否       | "circle"  | 水波图形状 |
| title   | string                                                | 否       | -         | 图表的标题 |
| theme   | "default" &#124; "dark" &#124; "academy"              | 否       | "default" | 图表主题   |
| style   | IStyle                                                | 否       | -         | 图表样式   |

### IStyle

| 属性            | 类型     | 是否必传 | 默认值 | 说明     |
| --------------- | -------- | -------- | ------ | -------- |
| backgroundColor | string   | 否       | -      | 背景颜色 |
| palette         | string[] | 否       | -      | 颜色映射 |

## Spec 示例

```json
{
  "type": "liquid",
  "percent": 0.6,
  "title": "This is a liquid chart"
}
```
