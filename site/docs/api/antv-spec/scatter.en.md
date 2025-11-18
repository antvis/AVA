---
title: Scatter
order: 6
redirect_from:
  - /en/docs/api/antv-spec/scatter
---

## Introduction

A scatter plot is a type of plot or mathematical diagram using Cartesian coordinates to display values for typically two variables for a set of data. It is used to observe relationships between variables and can reveal correlations, patterns, clusters, and outliers in the data.

## Spec

| Property   | Type                                     | Required | Default   | Description  |
| ---------- | ---------------------------------------- | -------- | --------- | ------------ |
| data       | ScatterDataItem[]                        | Yes      | -         | Data         |
| title      | string                                   | No       | -         | Chart title  |
| axisXTitle | string                                   | No       | -         | X-axis title |
| axisYTitle | string                                   | No       | -         | Y-axis title |
| theme      | "default" &#124; "dark" &#124; "academy" | No       | "default" | Chart theme  |
| style      | IStyle                                   | No       | -         | Chart style  |

### ScatterDataItem

| Property | Type   | Required | Default | Description                |
| -------- | ------ | -------- | ------- | -------------------------- |
| x        | number | Yes      | -       | Numeric variable on X-axis |
| y        | number | Yes      | -       | Numeric variable on Y-axis |
| group    | string | No       | -       | Data grouping name         |

### IStyle

| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |

## Spec example

```json
{
  "type": "scatter",
  "data": [
    { "x": 10, "y": 20, "group": "A" },
    { "x": 15, "y": 25, "group": "A" },
    { "x": 20, "y": 30, "group": "A" },
    { "x": 25, "y": 35, "group": "A" },
    { "x": 30, "y": 40, "group": "A" },
    { "x": 12, "y": 15, "group": "B" },
    { "x": 18, "y": 20, "group": "B" },
    { "x": 24, "y": 25, "group": "B" },
    { "x": 30, "y": 30, "group": "B" },
    { "x": 36, "y": 35, "group": "B" },
    { "x": 8, "y": 25, "group": "C" },
    { "x": 14, "y": 30, "group": "C" },
    { "x": 20, "y": 35, "group": "C" },
    { "x": 26, "y": 40, "group": "C" },
    { "x": 32, "y": 45, "group": "C" }
  ],
  "title": "Scatter Plot Example",
  "axisXTitle": "X Variable",
  "axisYTitle": "Y Variable"
}
```


