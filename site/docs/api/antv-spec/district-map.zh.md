---
title: 行政区划地图
order: 5
redirect_from:
  - /en/docs/api/antv-spec/district-map
---

## 简介

行政区划地图用于显示一个国家或地区的地理边界。

## Spec
| 属性     | 类型                                     | 是否必传 | 默认值    | 说明       |
| ---------- | ---------------------------------------- | -------- | --------- | ---------- |
| data       | DistrictMapDataItem[]                    | 是       | -         | 数据       |
| title      | string                                   | 否       | -         | 图表的标题 |
| district   | string                                   | 是       | -         | 行政区划代码 |
| theme      | "default" &#124; "dark" &#124; "academy"  | 否       | "default" | 图表主题   |

### DistrictMapDataItem
| 属性  | 类型   | 是否必传 | 默认值 | 说明         |
| ----- | ------ | -------- | ------ | ------------ |
| name  | string | 是       | -      | 行政区划名称 |
| value | number | 是       | -      | 行政区划值   |

## Spec 示例

```json
{
  "type": "district-map",
  "data": [
    { "name": "北京市", "value": 100 },
    { "name": "上海市", "value": 200 }
  ],
  "title": "This is a district map",
  "district": "330000"
}
```
