---
title: Network Graph
order: 14
redirect_from:
  - /zh/docs/api/antv-spec/network-graph
---

## Introduction

A network graph is a visual representation of relationships and connections between different entities. It consists of nodes (vertices) and edges (links) that show how various elements are interconnected, making it ideal for visualizing social networks, computer networks, organizational structures, and other complex relational data.

## Spec

| Property | Type               | Required | Default | Description |
| -------- | ------------------ | -------- | ------- | ----------- |
| type     | `string`           | Yes      | -       | Chart type, fixed to `network-graph` |
| data     | `NetworkGraphData` | Yes      | -       | Data        |

### NetworkGraphData

| Property | Type                 | Required | Default | Description                                                               |
| -------- | -------------------- | -------- | ------- | ------------------------------------------------------------------------- |
| nodes    | `NetworkGraphNode[]` | Yes      | -       | Nodes in the graph; each node represents an entity                        |
| edges    | `NetworkGraphEdge[]` | Yes      | -       | Edges in the graph; each edge represents a relationship between two nodes |

### NetworkGraphNode

| Property | Type     | Required | Default | Description                                  |
| -------- | -------- | -------- | ------- | -------------------------------------------- |
| name     | `string` | Yes      | -       | Node name; must be unique to identify a node |

### NetworkGraphEdge

| Property | Type     | Required | Default | Description                                                           |
| -------- | -------- | -------- | ------- | --------------------------------------------------------------------- |
| source   | `string` | Yes      | -       | Name of the source node; refers to the `name` of a `NetworkGraphNode` |
| target   | `string` | Yes      | -       | Name of the target node; refers to the `name` of a `NetworkGraphNode` |
| name     | `string` | Yes      | -       | Edge name for identification                                          |

## Spec example

```json
{
  "type": "network-graph",
  "data": {
    "nodes": [
      { "name": "Node A" },
      { "name": "Node B" },
      { "name": "Node C" },
      { "name": "Node D" }
    ],
    "edges": [
      { "source": "Node A", "target": "Node B", "name": "Edge 1" },
      { "source": "Node B", "target": "Node C", "name": "Edge 2" },
      { "source": "Node C", "target": "Node D", "name": "Edge 3" },
      { "source": "Node A", "target": "Node C", "name": "Edge 4" }
    ]
  }
}
```
