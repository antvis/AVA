---
title: 面积图
order: 1
redirect_from:
  - /en/docs/api/antv-spec/area
---

## 简介

面积图或面积图以图形方式显示定量数据。它基于折线图。轴和线之间的区域通常用颜色、纹理和阴影来强调。通常，人们用面积图来比较两个或多个量。

## Spec
| 属性       | 类型                                     | 是否必传 | 默认值    | 说明                                                |
| ---------- | ---------------------------------------- | -------- | --------- | --------------------------------------------------- |
| type       | string                                  | 是       | -         | 图表类型，固定为 `area` |
| data       | AreaDataItem[]                           | 是       | -         | 数据                                                |
| stack      | boolean                                  | 否       | -         | 是否开启堆叠，开启堆叠面积图需数据中含有 group 字段 |
| title      | string                                   | 否       | -         | 图表的标题                                          |
| axisXTitle | string                                   | 否       | -         | x 轴的标题                                          |
| axisYTitle | string                                   | 否       | -         | y 轴的标题                                          |
| theme      | "default" &#124; "dark" &#124; "academy" | 否       | "default" | 图表主题                                            |
| style      | IStyle                                   | 否       | -         | 图表样式                                            |

### AreaDataItem
| 属性  | 类型   | 是否必传 | 默认值 | 说明           |
| ----- | ------ | -------- | ------ | -------------- |
| time  | string | 是       | -      | 数据的时序名称 |
| value | number | 是       | -      | 数据的值       |
| group | string | 否       | -      | 数据分组名称   |

### IStyle
| 属性            | 类型     | 是否必传 | 默认值 | 说明           |
| --------------- | -------- | -------- | ------ | -------------- |
| backgroundColor | string   | 否       | -      | 背景颜色       |
| palette         | string[] | 否       | -      | 颜色映射       |
| lineWidth       | number   | 否       | -      | 图形描边的宽度 |

## Spec 示例

```json
{
  "type": "area",
  "data": [
    { "time": "Jan.", "value": 18.9, "group": "A" },
    { "time": "Feb.", "value": 28.8, "group": "A" },
    { "time": "Jan.", "value": 12.4, "group": "B" },
    { "time": "Feb.", "value": 23.2, "group": "B" }
  ],
  "stack": true,
  "title": "This is a stacked area chart",
  "axisXTitle": "time",
  "axisYTitle": "value"
}
```


