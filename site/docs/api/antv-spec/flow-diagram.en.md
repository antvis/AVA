---
title: Flow Diagram
order: 8
redirect_from:
  - /zh/docs/api/antv-spec/flow-diagram
---

## Introduction

A flow diagram is a type of diagram that represents a workflow or process.

## Spec

| Property | Type              | Required | Default | Description |
| -------- | ----------------- | -------- | ------- | ----------- |
| type     | string          | Yes      | -       | Chart type, fixed to `flow-diagram` |
| data     | `FlowDiagramData` | Yes      | -       | Data        |

### FlowDiagramData

| Property | Type                | Required | Default | Description                                                               |
| -------- | ------------------- | -------- | ------- | ------------------------------------------------------------------------- |
| nodes    | `FlowDiagramNode[]` | Yes      | -       | Nodes in the graph; each node represents an entity                        |
| edges    | `FlowDiagramEdge[]` | Yes      | -       | Edges in the graph; each edge represents a relationship between two nodes |

### FlowDiagramNode

| Property | Type     | Required | Default | Description                                  |
| -------- | -------- | -------- | ------- | -------------------------------------------- |
| name     | string | Yes      | -       | Node name; must be unique to identify a node |

### FlowDiagramEdge

| Property | Type     | Required | Default | Description                                                          |
| -------- | -------- | -------- | ------- | -------------------------------------------------------------------- |
| source   | string | Yes      | -       | Name of the source node; refers to the `name` of a `FlowDiagramNode` |
| target   | string | Yes      | -       | Name of the target node; refers to the `name` of a `FlowDiagramNode` |
| name     | string | No       | -       | Edge name for identification                                         |

## Spec example

```json
{
  "type": "flow-diagram",
  "data": {
    "nodes": [
      { "name": "Start" },
      { "name": "Process" },
      { "name": "End" }
    ],
    "edges": [
      { "source": "Start", "target": "Process" },
      { "source": "Process", "target": "End" }
    ]
  }
}
```
