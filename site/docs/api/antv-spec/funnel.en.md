---
title: Funnel Chart
order: 9
redirect_from:
  - /zh/docs/api/antv-spec/funnel
---

## Introduction

A funnel chart is a type of chart that is often used to represent stages in a sales process and show the amount of potential revenue for each stage.

## Spec

| Property | Type                                     | Required | Default   | Description |
| -------- | ---------------------------------------- | -------- | --------- | ----------- |
| type     | string                                  | Yes      | -         | Chart type, fixed to `funnel` |
| data     | FunnelDataItem[]                         | Yes      | -         | Data        |
| title    | string                                   | No       | -         | Chart title |
| theme    | "default" &#124; "dark" &#124; "academy" | No       | "default" | Chart theme |
| style    | IStyle                                   | No       | -         | Chart style |

### FunnelDataItem

| Property | Type   | Required | Default | Description        |
| -------- | ------ | -------- | ------- | ------------------ |
| category | string | Yes      | -       | Data category name |
| value    | number | Yes      | -       | Data value         |

### IStyle

| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |

## Spec example

```json
{
  "type": "funnel",
  "data": [
    { "category": "Impressions", "value": 500 },
    { "category": "Clicks", "value": 350 },
    { "category": "Downloads", "value": 200 },
    { "category": "Purchases", "value": 100 }
  ],
  "title": "This is a funnel chart"
}
```


