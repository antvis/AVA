---
title: 路径地图
order: 16
redirect_from:
  - /en/docs/api/antv-spec/path-map
---

## 简介

路径地图是一种用于展示地理路径和轨迹的图表类型。它可以在地图上绘制路线，显示起点、终点和途经点，非常适合用于展示出行路线、物流配送、运动轨迹等地理信息数据。

## Spec

| 属性        | 类型       | 是否必传 | 默认值 | 说明       |
| ----------- | ---------- | -------- | ------ | ---------- |
| data        | RoutData[] | 是       | -      | 数据       |
| markerStyle | Marker     | 否       | -      | 标记点样式 |
| pathStyle   | Polyline   | 否       | -      | 线样式     |

### RoutData

| 属性    | 类型         | 是否必传 | 默认值 | 说明     |
| ------- | ------------ | -------- | ------ | -------- |
| markers | MarkerData[] | 否       | -      | 路径标注 |
| path    | Polyline     | 是       | -      | 路径轨迹 |

### Polyline

| 属性       | 类型     | 是否必传 | 默认值 | 说明     |
| ---------- | -------- | -------- | ------ | -------- |
| points     | LngLat[] | 是       | -      | 路径标注 |
| width      | number | 否       | 2      | 轨迹宽度 |
| color      | string   | 否       | #16f   | 颜色     |
| dottedLine | boolean  | 否       | false  | 是否虚线 |

### MarkerData

| 属性      | 类型   | 是否必传 | 默认值 | 说明     |
| --------- | ------ | -------- | ------ | -------- |
| longitude | number | 是       | -      | 经度     |
| latitude  | number | 是       | -      | 纬度     |
| label     | string | 是       | -      | 文字标注 |

## Spec 示例

```json
{
  "type": "path-map",
  "data": [
    {
      "markers": [
        { "longitude": 116.4074, "latitude": 39.9042, "label": "北京" },
        { "longitude": 121.4737, "latitude": 31.2304, "label": "上海" },
        { "longitude": 113.2644, "latitude": 23.1291, "label": "广州" }
      ],
      "path": {
        "points": [
          { "longitude": 116.4074, "latitude": 39.9042 },
          { "longitude": 121.4737, "latitude": 31.2304 },
          { "longitude": 113.2644, "latitude": 23.1291 }
        ],
        "width": 3,
        "color": "#ff6b6b",
        "dottedLine": false
      }
    }
  ]
}
```
