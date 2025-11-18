---
title: Line Chart
order: 11
redirect_from:
  - /zh/docs/api/antv-spec/line
---

## Introduction

A line chart is a type of chart which displays information as a series of data points called 'markers' connected by straight line segments.

## Spec

| Property   | Type                                     | Required | Default   | Description  |
| ---------- | ---------------------------------------- | -------- | --------- | ------------ |
| type       | `string`                                  | Yes      | -         | Chart type, fixed to `line` |
| data       | LineDataItem[]                           | Yes      | -         | Data         |
| title      | string                                   | No       | -         | Chart title  |
| axisXTitle | string                                   | No       | -         | X-axis title |
| axisYTitle | string                                   | No       | -         | Y-axis title |
| theme      | "default" &#124; "dark" &#124; "academy" | No       | "default" | Chart theme  |
| style      | IStyle                                   | No       | -         | Chart style  |

### LineDataItem

| Property | Type   | Required | Default | Description        |
| -------- | ------ | -------- | ------- | ------------------ |
| time     | string | Yes      | -       | Time sequence name |
| value    | number | Yes      | -       | Value              |
| group    | string | No       | -       | Group name         |

### IStyle

| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |
| lineWidth       | number   | No       | -       | Stroke width     |

## Spec example

```json
{
  "type": "line",
  "data": [
    { "time": "Jan.", "value": 18.9 },
    { "time": "Feb.", "value": 28.8 },
    { "time": "Mar.", "value": 39.3 },
    { "time": "Apr.", "value": 81.4 }
  ],
  "title": "This is a line chart",
  "axisXTitle": "time",
  "axisYTitle": "value"
}
```


