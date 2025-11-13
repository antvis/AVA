---
title: Pin Map
order: 18
redirect_from:
  - /zh/docs/api/antv-spec/pin-map
---

## Introduction

A pin map is a visualization that displays geographical locations using markers or pins on a map. It is commonly used to show the distribution of points of interest, such as store locations, event venues, or any geographically distributed data, making it ideal for location-based analysis and spatial data visualization.

## Spec

| Property    | Type         | Required | Default | Description  |
| ----------- | ------------ | -------- | ------- | ------------ |
| data        | MarkerData[] | Yes      | -       | Data         |
| markerStyle | Marker       | No       | -       | Marker style |

### MarkerData

| Property  | Type   | Required | Default | Description |
| --------- | ------ | -------- | ------- | ----------- |
| longitude | number | Yes      | -       | Longitude   |
| latitude  | number | Yes      | -       | Latitude    |
| label     | number | Yes      | -       | Label text  |

## Spec example

```json
{
  "type": "pin-map",
  "data": [
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
    },
    {
      "longitude": 114.0579,
      "latitude": 22.5431,
      "label": "Shenzhen"
    }
  ]
}
```
