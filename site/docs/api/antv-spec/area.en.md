---
title: Area
order: 1
redirect_from:
  - /zh/docs/api/antv-spec/area
---

## Introduction

An area chart or area graph displays graphically quantitative data. It is based on the line chart. The area between axis and line are commonly emphasized with colors, textures and hatchings. Commonly one compares two or more quantities with an area chart.

## Spec  
| Property   | Type                                     | Required | Default   | Description                                                          |
| ---------- | ---------------------------------------- | -------- | --------- | -------------------------------------------------------------------- |
| data       | AreaDataItem[]                           | Yes      | -         | Data                                                                 |
| stack      | boolean                                  | No       | -         | Enable stacking. Stacked area chart requires the group field in data |
| title      | string                                   | No       | -         | Chart title                                                          |
| axisXTitle | string                                   | No       | -         | X-axis title                                                         |
| axisYTitle | string                                   | No       | -         | Y-axis title                                                         |
| theme      | "default" &#124; "dark" &#124; "academy" | No       | "default" | Chart theme                                                          |
| style      | IStyle                                   | No       | -         | Chart style                                                          |

### AreaDataItem  
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
  "type": "area",
  "data": [
    { "time": "Jan.", "value": 18.9, "group": "A" },
    { "time": "Feb.", "value": 28.8, "group": "A" },
    { "time": "Jan.", "value": 12.4, "group": "B" },
    { "time": "Feb.", "value": 23.2, "group": "B" }
  ],
  "stack": true,
  "title": "This is a stacked area chart",
  "axisXTitle": "time",
  "axisYTitle": "value"
}
```
