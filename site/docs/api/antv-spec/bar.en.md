---
title: Bar
order: 2
redirect_from:
  - /zh/docs/api/antv-spec/bar
---

## Introduction

A bar chart or bar graph is a chart or graph that presents categorical data with rectangular bars with heights or lengths proportional to the values that they represent. The bars can be plotted vertically or horizontally.

## Spec
| Property   | Type                                     | Required | Default   | Description           |
| ---------- | ---------------------------------------- | -------- | --------- | --------------------- |
| type       | `string`                                  | Yes      | -         | Chart type, fixed to `bar` |
| data       | BarDataItem[]                            | Yes      | -         | Data                  |
| title      | string                                   | No       | -         | Chart title           |
| axisXTitle | string                                   | No       | -         | X-axis title          |
| axisYTitle | string                                   | No       | -         | Y-axis title          |
| group      | boolean                                  | No       | false     | Whether to group data |
| stack      | boolean                                  | No       | false     | Whether to stack data |
| theme      | "default" &#124; "dark" &#124; "academy" | No       | "default" | Chart theme           |
| style      | IStyle                                   | No       | -         | Chart style           |

### BarDataItem
| Property | Type   | Required | Default | Description    |
| -------- | ------ | -------- | ------- | -------------- |
| category | string | Yes      | -       | Category name  |
| value    | number | Yes      | -       | Category value |
| group    | string | No       | -       | Group name     |

### IStyle
| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |

## Spec example

```json
{
  "type": "bar",
  "data": [
    {
      "category": "A",
      "value": 18.9,
      "group": "G1"
    },
    {
      "category": "B",
      "value": 28.8,
      "group": "G1"
    },
    {
      "category": "A",
      "value": 12.4,
      "group": "G2"
    },
    {
      "category": "B",
      "value": 23.2,
      "group": "G2"
    }
  ],
  "title": "This is a grouped bar chart",
  "axisXTitle": "category",
  "axisYTitle": "value",
  "group": true
}
```