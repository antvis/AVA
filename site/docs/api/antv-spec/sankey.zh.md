---
title: 桑基图
order: 14
redirect_from:
  - /zh/docs/api/antv-spec/sankey
---

## 简介

桑基图是一种用于展示流量分布和流向的图表类型。它通过有向边的宽度来表示流量的大小，非常适合展示能源流动、资金流向、用户转化路径等场景，能够直观地显示从源到目标的流量变化。

## Spec

| 属性      | 类型                                                   | 是否必传 | 默认值    | 说明         |
| --------- | ------------------------------------------------------ | -------- | --------- | ------------ |
| type      | `string`                                               | 是       | -         | 图表类型，固定为 `sankey` |
| data      | SankeyDataItem[]                                       | 是       | -         | 数据         |
| nodeAlign | "left" &#124; "center" &#124; "right" &#124; "justify" | 否       | "center"  | 节点对齐方式 |
| title     | string                                                 | 否       | -         | 图表的标题   |
| theme     | "default" &#124; "dark" &#124; "academy"               | 否       | "default" | 图表主题     |
| style     | IStyle                                                 | 否       | -         | 图表样式     |

### SankeyDataItem

| 属性   | 类型   | 是否必传 | 默认值 | 说明         |
| ------ | ------ | -------- | ------ | ------------ |
| source | string | 是       | -      | 源节点名称   |
| target | string | 是       | -      | 目标节点名称 |
| value  | number | 是       | -      | 流量值       |

### IStyle

| 属性            | 类型     | 是否必传 | 默认值 | 说明     |
| --------------- | -------- | -------- | ------ | -------- |
| backgroundColor | string   | 否       | -      | 背景颜色 |
| palette         | string[] | 否       | -      | 颜色映射 |

## Spec 示例

```json
{
  "type": "sankey",
  "data": [
    { "source": "A", "target": "X", "value": 10 },
    { "source": "A", "target": "Y", "value": 15 },
    { "source": "B", "target": "X", "value": 8 },
    { "source": "B", "target": "Z", "value": 12 },
    { "source": "C", "target": "Y", "value": 20 },
    { "source": "C", "target": "Z", "value": 5 },
    { "source": "X", "target": "D", "value": 18 },
    { "source": "Y", "target": "D", "value": 25 },
    { "source": "Z", "target": "E", "value": 17 }
  ],
  "nodeAlign": "center",
  "title": "流量图示例"
}
```


