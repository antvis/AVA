---
title: Fishbone Diagram
order: 7
redirect_from:
  - /zh/docs/api/antv-spec/fishbone-diagram
---

## Introduction

A fishbone diagram is a cause-and-effect diagram that helps managers track down the reasons for imperfections, variations, defects, or failures.

## Spec

| Property | Type           | Required | Default | Description |
| -------- | -------------- | -------- | ------- | ----------- |
| data     | `FishboneData` | Yes      | -       | Data        |

### FishboneData

| Property | Type             | Required | Default | Description                                                                                                                                       |
| -------- | ---------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| name     | `string`         | Yes      | -       | Node name                                                                                                                                         |
| children | `FishboneData[]` | No       | -       | Child nodes; if absent, it is a leaf. Each child is a `FishboneData` and can recursively contain its own children to form a multi-level structure |

## Spec example

```json
{
  "type": "fishbone-diagram",
  "data": {
    "name": "Effect",
    "children": [
      {
        "name": "Cause A",
        "children": [
          { "name": "Sub-cause A1" },
          { "name": "Sub-cause A2" }
        ]
      },
      {
        "name": "Cause B",
        "children": [
          { "name": "Sub-cause B1" }
        ]
      }
    ]
  }
}
```