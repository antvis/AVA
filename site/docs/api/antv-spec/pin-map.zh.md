---
title: 点标注地图
order: 18
redirect_from:
  - /en/docs/api/antv-spec/pin-map
---

## 简介

点标注地图是一种用于在地图上标注特定位置点的图表类型。它通过在地图上放置标记点来显示地理位置信息，可以展示商店分布、事件位置、人口分布等地理数据。

## Spec

| 属性        | 类型         | 是否必传 | 默认值 | 说明       |
| ----------- | ------------ | -------- | ------ | ---------- |
| data        | MarkerData[] | 是       | -      | 数据       |
| markerStyle | Marker       | 否       | -      | 标记点样式 |

### MarkerData

| 属性      | 类型   | 是否必传 | 默认值 | 说明     |
| --------- | ------ | -------- | ------ | -------- |
| longitude | number | 是       | -      | 经度     |
| latitude  | number | 是       | -      | 纬度     |
| label     | number | 是       | -      | 文字标注 |

## Spec 示例

```json
{
  "type": "pin-map",
  "data": [
    { "longitude": 116.4074, "latitude": 39.9042, "label": "北京" },
    { "longitude": 121.4737, "latitude": 31.2304, "label": "上海" },
    { "longitude": 113.2644, "latitude": 23.1291, "label": "广州" },
    { "longitude": 114.0579, "latitude": 22.5431, "label": "深圳" }
  ]
}
```
