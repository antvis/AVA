---
title: table
order: 10
redirect_from:
  - /en/docs/api/antv-spec/table
---

## Introduction

The table component presents structured data in rows and columns. It supports custom column names and cell content, making it suitable for quickly displaying two-dimensional data.

## Spec

| Property | Type              | Required | Default | Description |
| -------- | ----------------- | -------- | ------- | ----------- |
| type     | string          | Yes      | -       | Chart type, fixed to `table` |
| data     | `TableDataItem[]` | Yes      | -       | Data |
| title    | string          | No       | -       | Chart title |

### TableDataItem

| Property   | Type | Required | Default | Description |
| ---------- | ---- | -------- | ------- | ----------- |
| Any field  | any  | Yes      | -       | Column name as the key and cell value as the value; all keys within a row must align with the table header |

## Spec Example

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
