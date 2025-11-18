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
| type       | `string`                                  | Yes      | -         | Chart type, fixed to `dual-axes` |
| categories | string[]                                 | Yes      | -         | Categories   |
| series     | SeriesDataItem[]                         | Yes      | -         | Series       |
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
  "categories": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  "series": [
    {
      "type": "column",
      "data": [120, 132, 101, 134, 90, 230],
      "axisYTitle": "Sales (USD)"
    },
    {
      "type": "line",
      "data": [820, 932, 901, 934, 1290, 1330],
      "axisYTitle": "Revenue (USD)"
    }
  ],
  "title": "Sales vs Revenue - H1 2024",
  "axisXTitle": "Month",
  "theme": "default",
  "style": {
    "backgroundColor": "#ffffff",
    "palette": ["#5B8FF9", "#5AD8A6"],
    "lineWidth": 2
  }
}
```
