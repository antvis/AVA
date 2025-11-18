---
title: MindMap
order: 13
redirect_from:
  - /zh/docs/api/antv-spec/mind-map
---

## Introduction

A mind map is a hierarchical diagram used to visually organize information. It shows relationships among pieces of the whole through a branching structure radiating from a central concept, making it excellent for brainstorming, note-taking, planning, and organizing complex information.

## Spec

| Property | Type          | Required | Default | Description |
| -------- | ------------- | -------- | ------- | ----------- |
| type     | `string`      | Yes      | -       | Chart type, fixed to `mind-map` |
| data     | `MindMapData` | Yes      | -       | Data        |

### MindMapData

| Property | Type            | Required | Default | Description                                                                                                                                                                                                     |
| -------- | --------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name     | `string`        | Yes      | -       | Node name, displayed on the mind map node                                                                                                                                                                       |
| children | `MindMapData[]` | No       | -       | Current node's child node collection. If current node has no children, this field can be omitted. Each child node is also a `MindMapData` object, allowing recursive construction of multi-level tree structure |

## Spec example

```json
{
  "type": "mind-map",
  "data": {
    "name": "Main Topic",
    "children": [
      {
        "name": "Subtopic 1",
        "children": [
          { "name": "Detail 1.1" },
          { "name": "Detail 1.2" }
        ]
      },
      {
        "name": "Subtopic 2",
        "children": [
          { "name": "Detail 2.1" },
          { "name": "Detail 2.2" }
        ]
      },
      { "name": "Subtopic 3" }
    ]
  }
}
```
