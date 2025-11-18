---
title: Violin
order: 17
redirect_from:
  - /en/docs/api/antv-spec/violin
---

## Introduction

A violin plot is a statistical representation of numerical data that combines aspects of box plots and density plots. It shows the distribution of data across different categories by displaying the probability density of the data at different values, making it excellent for comparing distributions and understanding data variability.

## Spec

| Property   | Type                                     | Required | Default   | Description  |
| ---------- | ---------------------------------------- | -------- | --------- | ------------ |
| type       | string                                  | Yes      | -         | Chart type, fixed to `violin` |
| data       | ViolinDataItem[]                         | Yes      | -         | Data         |
| title      | string                                   | No       | -         | Chart title  |
| axisXTitle | string                                   | No       | -         | X-axis title |
| axisYTitle | string                                   | No       | -         | Y-axis title |
| theme      | "default" &#124; "dark" &#124; "academy" | No       | "default" | Chart theme  |
| style      | IStyle                                   | No       | -         | Chart style  |

### ViolinDataItem

| Property | Type   | Required | Default | Description         |
| -------- | ------ | -------- | ------- | ------------------- |
| category | string | Yes      | -       | Data category name  |
| value    | number | Yes      | -       | Data category value |
| group    | string | No       | -       | Data group name     |

### IStyle

| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |

## Spec example

```json
{
  "type": "violin",
  "data": [
    { "category": "Group A", "value": 25 },
    { "category": "Group A", "value": 30 },
    { "category": "Group A", "value": 35 },
    { "category": "Group B", "value": 20 },
    { "category": "Group B", "value": 25 },
    { "category": "Group B", "value": 40 },
    { "category": "Group C", "value": 15 },
    { "category": "Group C", "value": 35 },
    { "category": "Group C", "value": 45 }
  ],
  "title": "Distribution Comparison",
  "axisXTitle": "Group",
  "axisYTitle": "Value"
}
```
