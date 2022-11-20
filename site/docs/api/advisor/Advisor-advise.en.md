---
title: Advisor.advise
order: 11
---

<embed src='@/docs/common/style.md'></embed>


```sign
Advisor.advise(params: AdviseParams): ChartList[];
```

## Parameters

* **params** * Advisor configurations
  * _required_
  * `type`: AdviseParams

```ts
type AdviseParams = ChartAdviseParams | GraphAdviseParams;
```

`ChartAdviseParams` and `GraphAdviseParams` represent the types of parameters required for chart recommendations and graph recommendations, respectively.

### Chart recommendation parameters

* _**ChartAdviseParams**_ Parameter configuration.

| Properties   | Type                | Description                                                   | Default            |
| ------------ | ------------------- | ------------------------------------------------------------- | ------------------ |
| data         | `any[]`             | The source data.                                              | None               |
| fields       | `string[]`          | The data field information.                                   | None `Optional`    |
| smartColor   | `boolean`           | Whether to enable smart color matching.                       | `false` `Optional` |
| options      | `AdvisorOptions`    | The recommended configuration items for the statistics chart. | None `Optional`    |
| colorOptions | `SmartColorOptions` | The smartColor option.                                        | None `Optional`    |

* _**AdvisorOptions**_ Parameter configuration.

| property    | type          | description                                         | default         |
| ----------- | ------------- | --------------------------------------------------- | --------------- |
| purpose     | `Purpose`     | The purpose of the analysis.                        | None `Optional` |
| preferences | `Preferences` | Chart preferences.                                  | None `Optional` |
| refine      | `boolean`     | Whether to enable rule-based optimization.          | None `Optional` |
| fields      | `string[]`    | Data field information.                             | None `Optional` |
| showLog     | `boolean`     | Whether to show Log.                                | None `Optional` |
| theme       | `Theme`       | Specify color in hexadecimal.                       | None `Optional` |
| requireSpec | `boolean`     | Whether to recommend only Advices that include spec | true            |

* _**Purpose**_ Parameter configuration.

```ts
type PURPOSE_OPTIONS = ["Comparison", "Trend", "Distribution", "Rank", "Proportion", 
  "Composition", "Relation", "Hierarchy", "Flow", "Spatial", "Anomaly", "Value"];
```

* _**Preferences**_ Parameter configuration.

```ts
interface Preferences {
  canvasLayout: 'landscape' | 'portrait';
}
```

* _**Theme**_ Parameter configuration.

```ts
type Theme = {
  primaryColor?: string;
};
```

* _**SmartColorOptions**_ Parameter configuration.

```ts
type SmartColorOptions = {
  themeColor?: string;
  colorSchemeType?: ColorSchemeType;
  simulationType?: SimulationType;
}
```

| Properties      | Type              | Description                       | Default                    |
| --------------- | ----------------- | --------------------------------- | -------------------------- |
| themeColor      | `string`          | The hexadecimal theme color.      | `#006f94` `Optional`       |
| colorSchemeType | `ColorSchemeType` | The color swatch generation mode. | `monochromatic` `Optional` |
| simulationType  | `SimulationType`  | The color simulation mode.        | `normal` `Optional`        |


## Return value

_`ChartList[]`_

* _**ChartList**_ Parameter configuration.

| Properties | Type        | Description                      | Examples     |
| ---------- | ----------- | -------------------------------- | ------------ |
| type       | `ChartType` | The type of the chart.           | `line-chart` |
| spec       | `AntVSpec`  | The chart attribute information. | See below.   |
| score      | `number`    | The chart score.                 | `1.0`        |

* _**AntVSpec**_ Parameter configuration.

`AntVSpec` is the declarative grammar that supports various technology stacks of AntV. 
See [AntVSpec API](https://github.com/antvis/antv-spec/blob/master/API.md) for detail configurations.

| Properties | Description              | Examples                                                           |
| ---------- | ------------------------ | ------------------------------------------------------------------ |
| basis      | The basic information.   | `basis: { type: 'chart' }`                                         |
| data       | The data information.    | `data: { type: 'json-array', values: [...] }`                      |
| layer      | The drawing information. | `{ [ encoding: { x: {...} , y:{...} }, mark: { type: 'line' } ] }` |



