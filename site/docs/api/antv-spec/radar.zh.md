---
title: 雷达图
order: 11
redirect_from:
  - /zh/docs/api/antv-spec/radar
---

## 简介

雷达图是一种用于展示多维度数据的图表，通过从中心点向外辐射的轴线来表示不同的维度，适合比较多个对象在多个指标上的表现。

## Spec

| 属性  | 类型                                     | 是否必传 | 默认值    | 说明       |
| ----- | ---------------------------------------- | -------- | --------- | ---------- |
| type  | `string`                                | Yes      | -         | Chart type, fixed to `radar` |
| data  | RadarDataItem[]                          | 是       | -         | 数据       |
| title | string                                   | 否       | -         | 图表的标题 |
| theme | "default" &#124; "dark" &#124; "academy" | 否       | "default" | 图表主题   |
| style | IStyle                                   | 否       | -         | 图表样式   |

### RadarDataItem

| 属性  | 类型   | 是否必传 | 默认值 | 说明         |
| ----- | ------ | -------- | ------ | ------------ |
| name  | string | 是       | -      | 数据分类名称 |
| value | number | 是       | -      | 数据的值     |
| group | string | 否       | -      | 数据分组名称 |

### IStyle

| 属性            | 类型     | 是否必传 | 默认值 | 说明           |
| --------------- | -------- | -------- | ------ | -------------- |
| backgroundColor | string   | 否       | -      | 背景颜色       |
| palette         | string[] | 否       | -      | 颜色映射       |
| lineWidth       | number   | 否       | -      | 图形描边的宽度 |

## Spec 示例

```json
{
  "type": "radar",
  "data": [
    { "name": "销售能力", "value": 80, "group": "团队A" },
    { "name": "沟通技巧", "value": 75, "group": "团队A" },
    { "name": "技术能力", "value": 90, "group": "团队A" },
    { "name": "创新思维", "value": 85, "group": "团队A" },
    { "name": "领导能力", "value": 70, "group": "团队A" },
    { "name": "销售能力", "value": 65, "group": "团队B" },
    { "name": "沟通技巧", "value": 85, "group": "团队B" },
    { "name": "技术能力", "value": 75, "group": "团队B" },
    { "name": "创新思维", "value": 80, "group": "团队B" },
    { "name": "领导能力", "value": 95, "group": "团队B" }
  ],
  "title": "团队能力雷达图",
  "theme": "default"
}
```
