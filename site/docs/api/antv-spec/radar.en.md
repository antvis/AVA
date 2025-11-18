---
title: Radar
order: 11
redirect_from:
  - /en/docs/api/antv-spec/radar
---

## Introduction

A radar chart (also known as a spider chart or web chart) is a graphical method of displaying multivariate data in the form of a two-dimensional chart of three or more quantitative variables represented on axes starting from the same point. It is useful for comparing multiple items across several characteristics or dimensions.

## Spec

| Property | Type                                     | Required | Default   | Description |
| -------- | ---------------------------------------- | -------- | --------- | ----------- |
| type     | `string`                                  | Yes      | -         | Chart type, fixed to `radar` |
| data     | RadarDataItem[]                          | Yes      | -         | Data        |
| title    | string                                   | No       | -         | Chart title |
| theme    | "default" &#124; "dark" &#124; "academy" | No       | "default" | Chart theme |
| style    | IStyle                                   | No       | -         | Chart style |

### RadarDataItem

| Property | Type   | Required | Default | Description        |
| -------- | ------ | -------- | ------- | ------------------ |
| name     | string | Yes      | -       | Data category name |
| value    | number | Yes      | -       | Data value         |
| group    | string | No       | -       | Data grouping name |

### IStyle

| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |
| lineWidth       | number   | No       | -       | Stroke width     |

## Spec example

```json
{
  "type": "radar",
  "data": [
    { "name": "Speed", "value": 80, "group": "Product A" },
    { "name": "Reliability", "value": 90, "group": "Product A" },
    { "name": "Comfort", "value": 70, "group": "Product A" },
    { "name": "Safety", "value": 85, "group": "Product A" },
    { "name": "Efficiency", "value": 75, "group": "Product A" },
    { "name": "Speed", "value": 70, "group": "Product B" },
    { "name": "Reliability", "value": 85, "group": "Product B" },
    { "name": "Comfort", "value": 90, "group": "Product B" },
    { "name": "Safety", "value": 80, "group": "Product B" },
    { "name": "Efficiency", "value": 85, "group": "Product B" }
  ],
  "title": "Product Comparison"
}
```

