---
title: Pie Chart
order: 17
redirect_from:
  - /zh/docs/api/antv-spec/pie
---

## Introduction

A pie chart is a circular statistical graphic, which presents data as slices of a whole circle, used to show the proportional relationship of each category to the total. The angle of each slice is proportional to the numerical value it represents, with the entire pie representing the total sum of the data. Pie charts are particularly well-suited for displaying the proportional relationship of categorical data, offering a clear and intuitive visualization of the relative importance of each part to the whole. By using different colors for the slices, the comparison of category proportions becomes simple and direct.

## Spec

| Property    | Type                             | Required | Default   | Description                               |
| ----------- | -------------------------------- | -------- | --------- | ----------------------------------------- |
| data        | PieDataItem[]                    | Yes      | -         | Pie chart data                            |
| title       | string                           | No       | -         | Chart title                               |
| innerRadius | number                           | No       | -         | Inner radius; set to create a donut chart |
| theme       | 'default' | 'dark' | 'academy' | No       | "default" | Chart theme                               |
| style       | IStyle                           | No       | -         | Chart style                               |

### IStyle

| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |
| lineWidth       | number   | No       | -       | Stroke width     |

### PieDataItem

| Property | Type   | Required | Default | Description |
| -------- | ------ | -------- | ------- | ----------- |
| category | string | Yes      | -       | Slice name  |
| value    | number | Yes      | -       | Slice value |

## Spec example

```json
{
  "title": "My Pie Chart",
  "innerRadius": 0.6,
  "theme": "dark",
  "style": {
    "backgroundColor": "#222",
    "palette": ["#ff6b6b", "#f06595", "#cc5de8", "#845ef7", "#5c7cfa", "#339af0", "#22b8cf", "#20c997", "#51cf66", "#94d82d"],
    "lineWidth": 2
  },
  "data": [
    { "category": "Category A", "value": 27 },
    { "category": "Category B", "value": 25 },
    { "category": "Category C", "value": 18 },
    { "category": "Category D", "value": 15 },
    { "category": "Category E", "value": 10 },
    { "category": "Other", "value": 5 }
  ]
}
```

