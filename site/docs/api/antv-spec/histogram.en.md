---
title: Histogram
order: 10
redirect_from:
  - /zh/docs/api/antv-spec/histogram
---

## Introduction

A histogram is an approximate representation of the distribution of numerical data.

## Spec

| Property   | Type                                     | Required | Default   | Description  |
| ---------- | ---------------------------------------- | -------- | --------- | ------------ |
| data       | HistogramDataItem[]                      | Yes      | -         | Data         |
| title      | string                                   | No       | -         | Chart title  |
| axisXTitle | string                                   | No       | -         | X-axis title |
| axisYTitle | string                                   | No       | -         | Y-axis title |
| theme      | "default" &#124; "dark" &#124; "academy" | No       | "default" | Chart theme  |
| style      | IStyle                                   | No       | -         | Chart style  |

### IStyle

| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |

## Spec example

```json
{
  "type": "histogram",
  "data": [
    { "value": 1.2 },
    { "value": 3.4 },
    { "value": 2.2 },
    { "value": 4.1 },
    { "value": 3.8 }
  ],
  "title": "This is a histogram",
  "bin": 2
}
```
