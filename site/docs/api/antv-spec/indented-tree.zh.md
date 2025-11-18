---
title: 缩进树
order: 10
redirect_from:
  - /zh/docs/api/antv-spec/indented-tree
---

## 简介

缩进树，用于直观地展示层级结构和父子关系。

## Spec

| 属性 | 类型               | 是否必传 | 默认值 | 说明 |
| ---- | ------------------ | -------- | ------ | ---- |
| type | string           | 是       | -      | 图表类型，固定为 `indented-tree` |
| data | `IndentedTreeData` | 是       | -      | 数据 |

### IndentedTreeData

| 属性     | 类型                  | 是否必传   | 默认值  | 说明                                                                     |
| -------- | -------------------- | -------- | ------ | ------------------------------------------------------------------------ |
| name     | string             | 是       | -      | 节点的名称，用于显示在思维导图的节点上                                          |
| children | `IndentedTreeData[]` | 否       | -      | 当前节点的子节点集合。若节点无子，可省略。子节点亦为 `IndentedTreeData`，可递归嵌套 |

## Spec 示例

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
