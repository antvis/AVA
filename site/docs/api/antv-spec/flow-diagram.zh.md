---
title: 流程图
order: 8
redirect_from:
  - /en/docs/api/antv-spec/flow-diagram
---

## 简介

流程图是一种表示工作流或过程的图表。

## Spec

| 属性 | 类型              | 是否必传 | 默认值 | 说明 |
| ---- | ----------------- | -------- | ------ | ---- |
| data | `FlowDiagramData` | 是       | -      | 数据 |

### FlowDiagramData

| 属性  | 类型                | 是否必传 | 默认值 | 说明                                           |
| ----- | ------------------- | -------- | ------ | ---------------------------------------------- |
| nodes | `FlowDiagramNode[]` | 是       | -      | 网络图中的节点数组，每个节点表示一个实体       |
| edges | `FlowDiagramEdge[]` | 是       | -      | 网络图中的边数组，每条边表示两个节点之间的关系 |

### FlowDiagramNode

| 属性 | 类型     | 是否必传 | 默认值 | 说明                               |
| ---- | -------- | -------- | ------ | ---------------------------------- |
| name | `string` | 是       | -      | 节点的名称，必须唯一，用于标识节点 |

### FlowDiagramEdge

| 属性   | 类型     | 是否必传 | 默认值 | 说明                                                    |
| ------ | -------- | -------- | ------ | ------------------------------------------------------- |
| source | `string` | 是       | -      | 边的起始节点名称，指向 `FlowDiagramNode` 的 `name` 属性 |
| target | `string` | 是       | -      | 边的目标节点名称，指向 `FlowDiagramNode` 的 `name` 属性 |
| name   | `string` | 否       | -      | 边的名称，用于标识边                                    |

## Spec 示例

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
