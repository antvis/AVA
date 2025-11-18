---
title: Venn
order: 15
redirect_from:
  - /en/docs/api/antv-spec/venn
---

## Introduction

A Venn diagram is a graphical representation of all possible logical relationships between a finite collection of different sets. It uses overlapping circles to show the relationships between sets, with the overlap representing common elements and non-overlapping areas representing unique elements in each set.

## Spec

| Property | Type                                     | Required | Default   | Description |
| -------- | ---------------------------------------- | -------- | --------- | ----------- |
| type     | string                                  | Yes      | -         | Chart type, fixed to `venn` |
| data     | VennDataItem[]                           | Yes      | -         | Data        |
| title    | string                                   | No       | -         | Chart title |
| theme    | "default" &#124; "dark" &#124; "academy" | No       | "default" | Chart theme |
| style    | IStyle                                   | No       | -         | Chart style |

### VennDataItem

| Property | Type     | Required | Default | Description      |
| -------- | -------- | -------- | ------- | ---------------- |
| sets     | string[] | Yes      | -       | Venn chart sets  |
| value    | number   | Yes      | -       | Venn chart value |
| label    | string   | No       | -       | Venn chart label |

### IStyle

| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |

## Spec example

```json
{
  "type": "venn",
  "data": [
    { "sets": ["A"], "value": 10, "label": "Set A" },
    { "sets": ["B"], "value": 10, "label": "Set B" },
    { "sets": ["C"], "value": 10, "label": "Set C" },
    { "sets": ["A", "B"], "value": 2, "label": "A and B" },
    { "sets": ["A", "C"], "value": 2, "label": "A and C" },
    { "sets": ["B", "C"], "value": 2, "label": "B and C" },
    { "sets": ["A", "B", "C"], "value": 1, "label": "A, B and C" }
  ],
  "title": "Venn Diagram Example"
}
```
