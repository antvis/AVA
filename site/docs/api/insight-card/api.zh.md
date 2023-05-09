---
title: InsightCard
order: 0
redirect_from:
  - /zh/docs/api
---

```sign
InsightCard = (props: InsightCardProps): <InsightCard />
```

`InsightCard` 组件用于可视化展示数据洞察，支持两种使用方式：1. 渲染数据洞察结果，使用文本解读和图表可视化的形式展示数据中的洞察信息；2. 传递原始数据，组件内部调用 ava 库的 insight 模块，计算洞察并展示。

## 参数列表
* **props** * 输入参数
  * _必要参数_
  * `参数类型`: Props 对象

* ***InsightCardProps*** 参数配置

### `InsightCardProps`

| 属性名  | 类型   | 描述              |
| --------- | ------- | ------------------ |
| `title`   | `((defaultTitle?: ReactNode) => ReactNode) \| ReactNode`    | 卡片标题，可以是字符串或函数   |
| `insightInfo`  | `InsightCardInfo`   | 洞察结果数据，包含维度、指标、数据和分析结果等信息     |
| `headerTools`  | `Tool[]`  | 标题栏右侧的工具栏，数组中每个元素为一个工具对象|
| `footerTools`  | `Tool[]`  | 底部工具栏，数组中每个元素为一个工具对象   |
| `autoInsightOptions`  | `Omit<InsightOptions, 'visualization'> & { allData: { [x: string]: any }[] }` | 自动生成洞察结果的选项，该属性和 `insightInfo` 至少需要一个赋值 |
| `visualizationOptions`  | `InsightVisualizationOptions`    | 可视化选项，目前仅支持语言配置

`InsightOptions` 和 `InsightVisualizationOptions` 使用和 `ava/insight` 模块相同的类型定义，请查看： [insight API](../../api/insight/auto-insights)。

### `CommonProps`

| 属性名    | 类型           | 描述              |
| --------- | -------------- | ----------------- |
| `styles`  | `CSSProperties` | 自定义样式        |
| `className` | `string`      | 自定义 CSS 类名 |

### `InsightCardInfo`

| 属性名       | 类型               | 描述          |
| ------------ | ---------------------------------- | ----------------------------- |
| `dimensions` | `string[]`                         | 维度字段名列表                |
| `measures`   | `string[]`                         | 指标字段名列表                |
| `data`       | `{ [field: string]: any }[]`       | 数据                          |
| `subspace`   | `{ [field: string]: any } | null` | 洞察维度                      |
| `patterns`   | `InsightPattern[]`                 | 分析得到的洞察数据（可选）    |

`InsightPattern` 采用 `ava/insight` 输出的数据洞察结果一致的结构，具体的类型定义请查看： [insight API](../../api/insight/auto-insights)。

### `InsightCardEventHandlers`

| 属性名        | 类型                                                  | 描述                                                                                                 |
| ------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `onCopy`      | `(insightInfo?: InsightCardInfo, dom?: HTMLElement) => void` | 当卡片内容被复制时触发                                                                                 |
| `onCardExpose` | `(insightInfo?: InsightCardInfo, dom?: HTMLElement) => void` | 当卡片曝光时触发                                                                                     |
| `onChange`    | `(insightInfo?: InsightCardInfo, contentSpec?: NarrativeTextSpec) => void` | 当洞察数据发生变化时触发，`contentSpec` 是洞察内容对应的文本描述信息，由用户提供或自动生成 |

`NarrativeTextSpec` 采用 `ntv-schema` 定义的类型，具体的类型定义请参考： [ntv-schema](../../guide/ntv/ntv-schema)。
