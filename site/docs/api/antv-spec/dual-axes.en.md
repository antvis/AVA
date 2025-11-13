---
title: Dual Axes
order: 5
redirect_from:
  - /zh/docs/api/antv-spec/dual-axes
---

## Introduction

A dual-axes chart allows for the visualization of two different data series on the same chart, using two separate Y-axes.

## Spec
| Property   | Type                                     | Required | Default   | Description  |
| ---------- | ---------------------------------------- | -------- | --------- | ------------ |
| data       | DualAxesDataItem[]                       | Yes      | -         | Data         |
| title      | string                                   | No       | -         | Chart title  |
| axisXTitle | string                                   | No       | -         | X-axis title |
| axisYTitle | string                                   | No       | -         | Y-axis title |
| theme      | "default" &#124; "dark" &#124; "academy" | No       | "default" | Chart theme  |
| style      | IStyle                                   | No       | -         | Chart style  |

### SeriesDataItem
| Property   | Type     | Required | Default | Description   |
| ---------- | -------- | -------- | ------- | ------------- |
| type       | string   | Yes      | -       | Subchart type |
| data       | number[] | Yes      | -       | Subchart data |
| axisYTitle | string   | No       | -       | Y-axis title  |

### IStyle
| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |
| lineWidth       | number   | No       | -       | Stroke width     |

## Spec example

```json
{
  "type": "dual-axes",
  "data": [
    { "time": "Jan.", "value": 18.9, "series": "value" },
    { "time": "Feb.", "value": 28.8, "series": "value" },
    { "time": "Jan.", "value": 12.4, "series": "count" },
    { "time": "Feb.", "value": 23.2, "series": "count" }
  ],
  "title": "This is a dual-axes chart",
  "axisXTitle": "time",
  "series": [
    {
      "type": "column",
      "series": "value",
      "axisYTitle": "value"
    },
    {
      "type": "line",
      "series": "count",
      "axisYTitle": "count"
    }
  ]
}
```