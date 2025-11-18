---
title: Liquid Chart
order: 12
redirect_from:
  - /en/docs/api/antv-spec/liquid
---

## Introduction

A liquid chart is used to show the percentage of a quantity.

## Spec

| Property | Type                                                  | Required | Default   | Description        |
| -------- | ----------------------------------------------------- | -------- | --------- | ------------------ |
| percent  | number                                                | Yes      | -         | Percentage         |
| shape    | "rect" &#124; "circle" &#124; "pin" &#124; "triangle" | No       | "circle"  | Shape of the chart |
| title    | string                                                | No       | -         | Chart title        |
| theme    | "default" &#124; "dark" &#124; "academy"              | No       | "default" | Chart theme        |
| style    | IStyle                                                | No       | -         | Chart style        |

### IStyle

| Property        | Type     | Required | Default | Description      |
| --------------- | -------- | -------- | ------- | ---------------- |
| backgroundColor | string   | No       | -       | Background color |
| palette         | string[] | No       | -       | Color mapping    |

## Spec example

```json
{
  "type": "liquid",
  "percent": 0.6,
  "title": "This is a liquid chart"
}
```
