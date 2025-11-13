---
title: 漏斗图
order: 9
redirect_from:
  - /en/docs/api/antv-spec/funnel
---

## 简介

漏斗图是一种经常用于表示销售过程中的阶段并显示每个阶段的潜在收入金额的图表。

## Spec

| 属性  | 类型                                     | 是否必传 | 默认值    | 说明       |
| ----- | ---------------------------------------- | -------- | --------- | ---------- |
| data  | FunnelDataItem[]                         | 是       | -         | 数据       |
| title | string                                   | 否       | -         | 图表的标题 |
| theme | "default" &#124; "dark" &#124; "academy" | 否       | "default" | 图表主题   |
| style | IStyle                                   | 否       | -         | 图表样式   |

### FunnelDataItem

| 属性     | 类型   | 是否必传 | 默认值 | 说明         |
| -------- | ------ | -------- | ------ | ------------ |
| category | string | 是       | -      | 数据分类名称 |
| value    | number | 是       | -      | 数据的值     |

### IStyle

| 属性            | 类型     | 是否必传 | 默认值 | 说明     |
| --------------- | -------- | -------- | ------ | -------- |
| backgroundColor | string   | 否       | -      | 背景颜色 |
| palette         | string[] | 否       | -      | 颜色映射 |

## Spec 示例

```json
{
  "type": "funnel",
  "data": [
    { "category": "Impressions", "value": 500 },
    { "category": "Clicks", "value": 350 },
    { "category": "Downloads", "value": 200 },
    { "category": "Purchases", "value": 100 }
  ],
  "title": "This is a funnel chart"
}
```


