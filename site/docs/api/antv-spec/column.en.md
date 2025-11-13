---
title: Column
order: 4
redirect_from:
  - /zh/docs/api/antv-spec/column
---

## Introduction

A column chart is a data visualization where each category is represented by a rectangle with the height of the rectangle being proportional to the values being plotted.

## Spec
| Property   | Type                                     | Required | Default   | Description           |
| ---------- | ---------------------------------------- | -------- | --------- | --------------------- |
| data       | ColumnDataItem[]                         | Yes      | -         | Data                  |
| title      | string                                   | No       | -         | Chart title           |
| axisXTitle | string                                   | No       | -         | X-axis title          |
| axisYTitle | string                                   | No       | -         | Y-axis title          |
| group      | boolean                                  | No       | false     | Whether to group data |
| stack      | boolean                                  | No       | false     | Whether to stack data |
| theme      | "default" &#124; "dark" &#124; "academy" | No       | "default" | Chart theme           |
| style      | IStyle                                   | No       | -         | Chart style           |

### ColumnDataItem
| Property | Type   | Required | Default | Description         |
| -------- | ------ | -------- | ------- | ------------------- |
| category | string | Yes      | -       | Data category name  |
| value    | number | Yes      | -       | Data category value |
| group    | number | No       | -       | Data grouping name  |

### IStyle
| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |

## Spec example

```json
{
  "type": "column",
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
  "title": "This is a grouped column chart",
  "axisXTitle": "category",
  "axisYTitle": "value",
  "group": true
}
```