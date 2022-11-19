---
title: AutoChart
order: 0
redirect_from:
  - /en/docs/api
---

```sign
AutoChart = (props: Props): <ConfigProvider />
```

``AutoChart`` is an immediate auto visualization React component in AVA.
It can automatically generate and render the proper chart for visualization based on the input data with one-line of code.




## Parameter list

* **props** * Input parameters
  * _required_ parameters
  * `type`: Props object

* ***Props*** Parameter configuration.

| Properties | Type | Description | Default |  
| ----| ---- | ---- | ----- |
| data | `any[]` | The source data. | Default mock panel `Optional` |
| fields | `string[]` | Recommended data fields. | Use all `Optional` |
| title | `string` | The title of the container. | None `Optional` |
| description | `string` | The container description information. | None `Optional` |
| width | `React.CSSProperties['width']` | Width. | `100%` `Optional` |
| height | `React.CSSProperties['width']` | Height. | `100%` `Optional` |
| className | `string` | The class name of the container. | None `Optional` |
| language | `"zh-CN" | "en-US"` | Language. | `"zh-CN"` `Optional` |
| purpose | `Purpose` | Specifies the purpose of the chart analysis. | None `Optional` |
| showRanking | `boolean` | Whether to show the recommended chart ranking. | `true` `Optional` |
| noDataContent | `React.ReactNode` | Show nodes when custom data is empty. | None `Optional` |

* ***Purpose*** Parameter configuration.

```ts
type PURPOSE_OPTIONS = ["Comparison", "Trend", "Distribution", "Rank", "Proportion", 
  "Composition", "Relation", "Hierarchy", "Flow", "Spatial", "Anomaly", "Value"];
```


## Data

### data

<description>**optional** _any[]_</description>

Row data array. If empty, mock panel is available.

### fields

<description>**optional** _string[]_</description>

The fields for chart recommendations.


## Container

### title

<description>**optional** _string_</description>

Chart title.

### description

<description>**optional** _string_</description>

Chart description.

### width

<description>**optional** _React.CSSProperties['width']_ _default:_ `"100%"`</description>

Container width.

### height

<description>**optional** _React.CSSProperties['height']_ _default:_ `"100%"`</description>

Container height.

### className

<description>**optional** _string_</description>

Container className.

### language

<description>**optional** _"zh-CN" | "en-US"_ _default:_ `"zh-CN"`</description>

Internationalization.

## Configuration

### purpose

<description>**optional** _Purpose_</description>

The purpose of visualization.

### showRanking

<description>**optional** _boolean_ _default:_ `true`</description>

Whether to display the recommended ranking, it can be used to switch chart type.

<!-- ### configurable

<description>**optional** _boolean_ _default:_ `true`</description>

Whether show config panel. -->

### noDataContent

<description>**optional** _React.ReactNode_</description>

To render content without data. 
