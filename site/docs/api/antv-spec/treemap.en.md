---
title: Treemap
order: 8
redirect_from:
  - /en/docs/api/antv-spec/treemap
---

## Introduction

A treemap is a visualization method for displaying hierarchical data using nested rectangles. Each branch of the hierarchy is given a colored rectangle, and smaller rectangles represent sub-branches. The size and color of rectangles can be used to represent different dimensions of data, making it excellent for visualizing part-to-whole relationships and hierarchical structures.

## Spec

| Property | Type                                     | Required | Default   | Description |
| -------- | ---------------------------------------- | -------- | --------- | ----------- |
| data     | TreemapDataItem[]                        | Yes      | -         | Data        |
| title    | string                                   | No       | -         | Chart title |
| theme    | "default" &#124; "dark" &#124; "academy" | No       | "default" | Chart theme |
| style    | IStyle                                   | No       | -         | Chart style |

### TreemapDataItem

| Property | Type       | Required | Default | Description      |
| -------- | ---------- | -------- | ------- | ---------------- |
| name     | string     | Yes      | -       | Category name    |
| value    | number     | Yes      | -       | Category value   |
| children | TreeNode[] | No       | -       | Subcategory list |

### IStyle

| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |

## Spec example

```json
{
  "type": "treemap",
  "data": [
    {
      "name": "Technology",
      "value": 500,
      "children": [
        { "name": "Software", "value": 300 },
        { "name": "Hardware", "value": 200 }
      ]
    },
    {
      "name": "Marketing",
      "value": 300,
      "children": [
        { "name": "Digital", "value": 180 },
        { "name": "Traditional", "value": 120 }
      ]
    },
    {
      "name": "Sales",
      "value": 200,
      "children": [
        { "name": "Online", "value": 120 },
        { "name": "Retail", "value": 80 }
      ]
    }
  ],
  "title": "Company Budget Distribution"
}
```


