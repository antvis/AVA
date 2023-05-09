---
title: InsightCard
order: 0
redirect_from:
  - /en/docs/api
---

```sign
InsightCard = (props: InsightCardProps): <InsightCard />
```

The `InsightCard` component is used to visualize data insights. It supports two usage modes: 1. Rendering data insight results by displaying textual interpretations and visualizations of the insights in the data. 2. Providing raw data to the component, which internally uses the `ava` library's insight module to compute and display insights.

## Parameter List
* **props*** - Input parameters
  * _Required_
  * `Parameter Type`: Props object

* ***InsightCardProps*** - Parameter Configuration

### `InsightCardProps`

| Property Name | Type                                 | Description                                     |
| ------------- | ------------------------------------ | ----------------------------------------------- |
| `title`       | `((defaultTitle?: ReactNode) => ReactNode) \| ReactNode` | The title of the card, can be a string or a function |
| `insightInfo` | `InsightCardInfo`                    | The insight result data, including dimensions, measures, data, and analysis results |
| `headerTools` | `Tool[]`                             | Tools in the header of the card, each element is a tool object |
| `footerTools` | `Tool[]`                             | Tools in the footer of the card, each element is a tool object |
| `autoInsightOptions` | `Omit<InsightOptions, 'visualization'> & { allData: { [x: string]: any }[] }` | Options used to generate the insight result automatically. Either this property or `insightInfo` must be assigned |
| `visualizationOptions` | `InsightVisualizationOptions`   | Visualization options, currently only language configuration is supported

The `InsightOptions` and `InsightVisualizationOptions` use the same type definitions as the `ava/insight` module. Please refer to the [insight API](../../api/insight/auto-insights) for more details.

### `CommonProps`

| Property Name | Type           | Description          |
| ------------- | -------------- | -------------------- |
| `styles`      | `CSSProperties` | Custom styles        |
| `className`   | `string`       | Custom CSS class name |

### `InsightCardInfo`

| Property Name | Type                                  | Description                |
| ------------- | ------------------------------------- | -------------------------- |
| `dimensions`  | `string[]`                            | List of dimension field names |
| `measures`    | `string[]`                            | List of measure field names |
| `data`        | `{ [field: string]: any }[]`          | Data                        |
| `subspace`    | `{ [field: string]: any } \| null`    | Insight dimension           |
| `patterns`    | `InsightPattern[]`                    | Analysis-generated insight data (optional) |

The `InsightPattern` has the same structure as the data insight results output by the `ava/insight` module. Please refer to the [insight API](../../api/insight/auto-insights) for the specific type definitions.

### `InsightCardEventHandlers`

| Property Name   | Type                                                  | Description                                                                                       |
| --------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `onCopy`        | `(insightInfo?: InsightCardInfo, dom?: HTMLElement) => void` | Event emitted when the card content is copied                                                   |
| `onCardExpose`  | `(insightInfo?: InsightCardInfo, dom?: HTMLElement) => void` | Event emitted when the card is exposed                                                           |
| `onChange`      | `(insightInfo?: InsightCardInfo, contentSpec?: NarrativeTextSpec) => void` | Event emitted when the insight data changes. `contentSpec` is the textual description of the insight content, provided by the user or generated automatically |

The `NarrativeTextSpec` follows the type definitions defined by `ntv-schema`. Please refer to [ntv-schema](../../guide/ntv/ntv-schema) for the specific type definitions.
