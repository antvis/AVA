---
title: 组织架构图
order: 15
redirect_from:
  - /en/docs/api/antv-spec/organization-chart
---

## 简介

组织架构图是一种用于展示组织内部层级结构和人员关系的图表类型。它通过树状结构清晰地展示公司或组织的管理层级、部门划分和汇报关系，是企业管理中常用的可视化工具。

## Spec

| 属性 | 类型                    | 是否必传 | 默认值 | 说明 |
| ---- | ----------------------- | -------- | ------ | ---- |
| type | string                | 是       | -      | 图表类型，固定为 `organization-chart` |
| data | `OrganizationChartData` | 是       | -      | 数据 |

### OrganizationChartData

| 属性        | 类型                      | 是否必传 | 默认值 | 说明                                                                                                                                                                                            |
| ----------- | ------------------------- | -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name        | string                  | 是       | -      | 节点的名称，表示职位或部门的名称，必须唯一                                                                                                                                                      |
| description | string                  | 否       | -      | 节点的描述信息，可以包含职位职责或部门简介等                                                                                                                                                    |
| children    | `OrganizationChartData[]` | 否       | -      | 节点数组，表示下级职位或部门。如果当前节点没有子节点，该字段可以省略。每个子节点本身也是一个 `OrganizationChartData` 对象，这意味着它可以包含自己的子节点，从而递归地构建出一个多层次的树状结构 |

## Spec 示例

```json
{
  "type": "organization-chart",
  "data": {
    "name": "CEO",
    "description": "首席执行官",
    "children": [
      {
        "name": "CTO",
        "description": "首席技术官",
        "children": [
          { "name": "前端开发团队", "description": "负责用户界面开发" },
          { "name": "后端开发团队", "description": "负责服务器端开发" }
        ]
      },
      {
        "name": "CFO",
        "description": "首席财务官",
        "children": [
          { "name": "会计部门", "description": "负责财务核算" },
          { "name": "审计部门", "description": "负责内部审计" }
        ]
      }
    ]
  }
}
```
