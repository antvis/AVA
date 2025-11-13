---
title: Path Map
order: 16
redirect_from:
  - /zh/docs/api/antv-spec/path-map
---

## Introduction

A path map is a visualization that displays routes, paths, or trajectories on a geographical map. It is commonly used to show movement patterns, travel routes, delivery paths, or any sequence of connected geographical points, making it ideal for logistics, transportation, and location-based analysis.

## Spec

| Property    | Type       | Required | Default | Description  |
| ----------- | ---------- | -------- | ------- | ------------ |
| data        | RoutData[] | Yes      | -       | Data         |
| markerStyle | Marker     | No       | -       | Marker style |
| pathStyle   | Polyline   | No       | -       | Path style   |

### RoutData

| Property | Type         | Required | Default | Description |
| -------- | ------------ | -------- | ------- | ----------- |
| markers  | MarkerData[] | No       | -       | Path labels |
| path     | Polyline     | Yes      | -       | Route path  |

### Polyline

| Property   | Type     | Required | Default | Description   |
| ---------- | -------- | -------- | ------- | ------------- |
| points     | LngLat[] | Yes      | -       | Path points   |
| width      | Polyline | No       | 2       | Path width    |
| color      | string   | No       | #16f    | Color         |
| dottedLine | boolean  | No       | false   | Dashed or not |

### MarkerData

| Property  | Type   | Required | Default | Description |
| --------- | ------ | -------- | ------- | ----------- |
| longitude | number | Yes      | -       | Longitude   |
| latitude  | number | Yes      | -       | Latitude    |
| label     | number | Yes      | -       | Label text  |

## Spec example

```json
{
  "type": "path-map",
  "data": [
    {
      "path": {
        "points": [
          { "longitude": 116.4074, "latitude": 39.9042 },
          { "longitude": 121.4737, "latitude": 31.2304 },
          { "longitude": 113.2644, "latitude": 23.1291 }
        ],
        "width": 3,
        "color": "#ff6b6b",
        "dottedLine": false
      },
      "markers": [
        {
          "longitude": 116.4074,
          "latitude": 39.9042,
          "label": "Beijing"
        },
        {
          "longitude": 121.4737,
          "latitude": 31.2304,
          "label": "Shanghai"
        },
        {
          "longitude": 113.2644,
          "latitude": 23.1291,
          "label": "Guangzhou"
        }
      ]
    }
  ]
}
```
