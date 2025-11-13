---
title: Boxplot
order: 3
redirect_from:
  - /zh/docs/api/antv-spec/boxplot
---

## Introduction

A box plot (also known as a box-and-whisker plot) is a standardized way of displaying the distribution of data based on a five-number summary (minimum, first quartile (Q1), median, third quartile (Q3), and maximum).

## Spec
| Property   | Type                                     | Required | Default   | Description  |
| ---------- | ---------------------------------------- | -------- | --------- | ------------ |
| data       | BoxplotDataItem[]                        | Yes      | -         | Data         |
| title      | string                                   | No       | -         | Chart title  |
| axisXTitle | string                                   | No       | -         | X-axis title |
| axisYTitle | string                                   | No       | -         | Y-axis title |
| title      | string                                   | No       | -         | Chart title  |
| theme      | "default" &#124; "dark" &#124; "academy" | No       | "default" | Chart theme  |
| style      | IStyle                                   | No       | -         | Chart style  |

### BoxplotDataItem
| Property | Type   | Required | Default | Description         |
| -------- | ------ | -------- | ------- | ------------------- |
| category | string | Yes      | -       | Data category name  |
| value    | number | Yes      | -       | Data category value |
| group    | number | No       | -       | Data group name     |

### IStyle
| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |

## Spec example

```json
{
  "type": "boxplot",
  "data": [
    {
      "category": "A",
      "value": 60
    },
    {
      "category": "A",
      "value": 80
    },
    {
      "category": "B",
      "value": 20
    },
    {
      "category": "B",
      "value": 110
    }
  ],
  "title": "This is a boxplot",
  "axisXTitle": "category",
  "axisYTitle": "value"
}
```