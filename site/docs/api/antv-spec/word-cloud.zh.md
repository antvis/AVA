---
title: 词云图
order: 7
redirect_from:
  - /zh/docs/api/antv-spec/word-cloud
---

## 简介

词云图是一种文本数据可视化图表，通过不同大小和颜色的文字来展示文本数据中词语的频率或重要性。

## Spec

| 属性  | 类型                                     | 是否必传 | 默认值    | 说明       |
| ----- | ---------------------------------------- | -------- | --------- | ---------- |
| data  | WordCloudDataItem[]                      | 是       | -         | 数据       |
| title | string                                   | 否       | -         | 图表的标题 |
| theme | "default" &#124; "dark" &#124; "academy" | 否       | "default" | 图表主题   |
| style | IStyle                                   | 否       | -         | 图表样式   |

### WordCloudDataItem

| 属性  | 类型   | 是否必传 | 默认值 | 说明 |
| ----- | ------ | -------- | ------ | ---- |
| text  | string | 是       | -      | 文本 |
| value | number | 是       | -      | 词频 |

### IStyle

| 属性            | 类型     | 是否必传 | 默认值 | 说明     |
| --------------- | -------- | -------- | ------ | -------- |
| backgroundColor | string   | 否       | -      | 背景颜色 |
| palette         | string[] | 否       | -      | 颜色映射 |

## Spec 示例

```json
{
  "type": "word-cloud",
  "data": [
    { "text": "数据可视化", "value": 100 },
    { "text": "图表", "value": 80 },
    { "text": "分析", "value": 75 },
    { "text": "设计", "value": 60 },
    { "text": "交互", "value": 55 },
    { "text": "美观", "value": 50 },
    { "text": "功能", "value": 45 },
    { "text": "性能", "value": 40 }
  ],
  "title": "词云图示例",
  "theme": "default"
}
```
