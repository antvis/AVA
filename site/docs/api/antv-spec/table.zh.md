---
title: 表格
order: 10
redirect_from:
  - /zh/docs/api/antv-spec/table
---

## 简介

表格组件用于将结构化数据以行列形式展示，支持自定义列名与单元格内容，适合快速呈现二维数据。

## Spec

| 属性  | 类型            | 是否必传 | 默认值 | 说明       |
| ----- | --------------- | -------- | ------ | ---------- |
| type  | `string`        | 是       | -      | 图表类型，固定为 `table` |
| data  | TableDataItem[] | 是       | -      | 数据       |
| title | string          | 否       | -      | 图表的标题 |

### TableDataItem

| 属性     | 类型 | 是否必传 | 默认值 | 说明                                                                  |
| -------- | ---- | -------- | ------ | --------------------------------------------------------------------- |
| 任意字段 | any  | 是       | -      | 列名作为 key，单元格值作为 value；一行内所有 key 必须与表头保持一致。 |

## Spec 示例

```json
{
  "type": "table",
  "data": [
    {
      "name": "Row 1",
      "age": 25
    },
    {
      "name": "Row 2",
      "age": 30
    }
  ],
  "title": "Example Table"
}
```
