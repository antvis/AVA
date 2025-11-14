---
title: 矩形树图
order: 8
redirect_from:
  - /zh/docs/api/antv-spec/treemap
---

## 简介

矩形树图是一种用于展示层次结构数据的图表类型。它使用嵌套的矩形来表示数据的层级关系，每个矩形的大小代表该分类的数值大小，非常适合展示文件系统结构、组织架构、预算分配等具有层次结构的数据。

## Spec

| 属性  | 类型                                     | 是否必传 | 默认值    | 说明       |
| ----- | ---------------------------------------- | -------- | --------- | ---------- |
| data  | TreemapDataItem[]                        | 是       | -         | 数据       |
| title | string                                   | 否       | -         | 图表的标题 |
| theme | "default" &#124; "dark" &#124; "academy" | 否       | "default" | 图表主题   |
| style | IStyle                                   | 否       | -         | 图表样式   |

### TreemapDataItem

| 属性     | 类型       | 是否必传 | 默认值 | 说明           |
| -------- | ---------- | -------- | ------ | -------------- |
| name     | string     | 是       | -      | 分类名称       |
| value    | number     | 是       | -      | 分类的数值大小 |
| children | TreeNode[] | 否       | -      | 子分类列表     |

### IStyle

| 属性            | 类型     | 是否必传 | 默认值 | 说明     |
| --------------- | -------- | -------- | ------ | -------- |
| backgroundColor | string   | 否       | -      | 背景颜色 |
| palette         | string[] | 否       | -      | 颜色映射 |

## Spec 示例

```json
{
  "type": "treemap",
  "data": [
    { "name": "技术部门", "value": 500, "children": [{ "name": "软件开发", "value": 300 }, { "name": "硬件开发", "value": 200 }] },
    { "name": "市场部门", "value": 300, "children": [{ "name": "数字营销", "value": 180 }, { "name": "传统营销", "value": 120 }] },
    { "name": "销售部门", "value": 200, "children": [{ "name": "在线销售", "value": 120 }, { "name": "零售销售", "value": 80 }] }
  ],
  "title": "公司预算分布"
}
```


