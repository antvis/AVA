---
title: Sankey
order: 14
redirect_from:
  - /en/docs/api/antv-spec/sankey
---

## Introduction

A Sankey diagram is a type of flow diagram that shows the flow of resources or quantities between different nodes or categories. The width of the flows is proportional to the quantity, making it excellent for visualizing energy flows, material flows, cost breakdowns, or any process where understanding the magnitude of flow is important.

## Spec

| Property  | Type                                                   | Required | Default   | Description    |
| --------- | ------------------------------------------------------ | -------- | --------- | -------------- |
| data      | SankeyDataItem[]                                       | Yes      | -         | Data           |
| nodeAlign | "left" &#124; "center" &#124; "right" &#124; "justify" | No       | "center"  | Node alignment |
| title     | string                                                 | No       | -         | Chart title    |
| theme     | "default" &#124; "dark" &#124; "academy"               | No       | "default" | Chart theme    |
| style     | IStyle                                                 | No       | -         | Chart style    |

### SankeyDataItem

| Property | Type   | Required | Default | Description      |
| -------- | ------ | -------- | ------- | ---------------- |
| source   | string | Yes      | -       | Source node name |
| target   | string | Yes      | -       | Target node name |
| value    | number | Yes      | -       | Flow value       |

### IStyle

| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |

## Spec example

```json
{
  "type": "sankey",
  "data": [
    { "source": "A", "target": "X", "value": 10 },
    { "source": "A", "target": "Y", "value": 15 },
    { "source": "B", "target": "X", "value": 8 },
    { "source": "B", "target": "Z", "value": 12 },
    { "source": "C", "target": "Y", "value": 20 },
    { "source": "C", "target": "Z", "value": 5 },
    { "source": "X", "target": "D", "value": 18 },
    { "source": "Y", "target": "D", "value": 25 },
    { "source": "Z", "target": "E", "value": 17 }
  ],
  "nodeAlign": "center",
  "title": "Flow Diagram Example"
}
```


