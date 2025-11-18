---
title: indented-tree
order: 10
redirect_from:
  - /en/docs/api/antv-spec/indented-tree
---

## Introduction

An indented tree visualizes hierarchical structures and parent–child relationships.

## Spec

| Property | Type               | Required | Default | Description |
| -------- | ------------------ | -------- | ------- | ----------- |
| type     | `string`           | Yes      | -       | Chart type, fixed to `indented-tree` |
| data     | `IndentedTreeData` | Yes      | -       | Data |

### IndentedTreeData

| Property | Type                  | Required | Default | Description |
| -------- | --------------------- | -------- | ------- | ----------- |
| name     | `string`              | Yes      | -       | The node’s display name |
| children | `IndentedTreeData[]`  | No       | -       | Child nodes of the current node. Omit if none. Children are also `IndentedTreeData` and can nest recursively |

## Spec Example

```json
{
  "type": "indented-tree",
  "data": {
    "name": "Root",
    "children": [
      {
        "name": "Child 1",
        "children": [
          { "name": "Grandchild 1" },
          { "name": "Grandchild 2" }
        ]
      },
      { "name": "Child 2" }
    ]
  }
}
```
