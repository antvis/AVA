---
title: Advisor.advise
order: 4
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
Advisor.advise(params: AdviseParams): ChartList[];
```

### Parameters

* **params** * Advisor configurations
  * _required_
  * `type`: AdviseParams

```ts
type AdviseParams = ChartAdviseParams | GraphAdviseParams;
```

`ChartAdviseParams` and `GraphAdviseParams` represent the types of parameters required for chart recommendations and graph recommendations, respectively.

#### Chart recommendation parameters

* ***ChartAdviseParams*** Parameter configuration.

```ts
type ChartAdviseParams = {
  data: [];
  fields?: string[];
  smartColor?: boolean;
  options?: AdvisorOptions;
  colorOptions?: SmartColorOptions;
};
```

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| data | `[]` | The source data. | None |
| fields | `string[]` | The data field information. | None |
| smartColor | `boolean` | Whether to enable smart color matching. | `false` | options
| options | `AdvisorOptions` | The recommended configuration items for the statistics chart. | options
| colorOptions | `SmartColorOptions` | The smartColor option. | None | 

* ***AdvisorOptions*** Parameter configuration.

```ts
type AdvisorOptions = {
  purpose?: Purpose;
  preferences?: Preferences;
  refine?: boolean;
  fields?: string[];
  showLog?: boolean;
  theme?: Theme;
};
```

| property | type | description | default |  
| ----| ---- | ---- | -----|
| purpose | `Purpose` | The purpose of the analysis. | None |
| preferences | `Preferences` | Chart preferences. | None |
| refine | `boolean` | Whether to enable rule-based optimization. | None | fields
| fields | `string[]` | Data field information. | None | showLog
| showLog | `boolean` | Whether to show Log. | None |
| theme | `Theme` | Specify color in hexadecimal. | None |

* ***Purpose*** Parameter configuration.

```ts
type PURPOSE_OPTIONS = [
  "Comparison", 
  "Trend", 
  "Distribution", 
  "Rank", 
  "Proportion", 
  "Composition", 
  "Relation", 
  "Hierarchy", 
  "Flow", 
  "Spatial", 
  "Anomaly", 
  "Value"
  ];
```

* ***Preferences*** Parameter configuration.

```ts
interface Preferences {
  canvasLayout: 'landscape' | 'portrait';
}
```

* ***Theme*** Parameter configuration.

```ts
type Theme = {
  primaryColor?: string;
};
```

* ***SmartColorOptions*** Parameter configuration.

```ts
type SmartColorOptions = {
  themeColor?: string;
  colorSchemeType?: ColorSchemeType;
  simulationType?: SimulationType;
}
```
| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| themeColor | `string` | The hexadecimal theme color. | `#006f94` |
| colorSchemeType | `ColorSchemeType` | The color swatch generation mode. | `monochromatic` |
| simulationType | `SimulationType` | The color simulation mode. | `normal` |

#### Graph recommendation parameters

* ***GraphAdviseParams*** Parameter configuration.

```ts
type GraphAdviseParams = {
  data: [];
  fields?: {
    nodes: string[];
    links: string[];
  };
  options?: GraphAdvisorOptions;
};
```

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| data | `[]` | The source data. | None |
| fields | `{ nodes, links }` | Data point edge information. | None | options
| options | `GraphAdvisorOptions` | Graph recommendation configuration items. | None |

* ***GraphAdvisorOptions*** Parameter configuration.

```ts
type GraphAdvisorOptions = {
  nodeColors?: string[];
  nodeSizeRange?: number[];
  edgeWidthRange?: number[];
  extra?: {
    nodeKey?: string; // key for node array in data object
    edgeKey?: string; // key for edge array in data object
    sourceKey?: string; // key for edge source in edge object
    targetKey?: string;
    childrenKey?: string;
  };
  ...AdvisorOptions;
};
```

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| nodeColors | `string[]` | The color of the node. | None |
| nodeSizeRange | `number[]` | The node size range. | None | nodeSizeRange
| edgeWidthRange | `number[]` | The width range of the edge. |None |
| extra | `{}` | Specifies the graph-related attributes. | None |
| *Key | `string` | Specifies the location of the point-edge relationship (point, edge, origin, pointing). | None |
| AdvisorOptions | `AdvisorOptions` | Same as the recommended configuration items for statistical graphs. | None |



### Return value

*`ChartList[]`* 

* ***ChartList*** Parameter configuration.

```ts
type ChartList = {
  type: ChartType;
  spec: AntVSpec;
  score: number;
};
```

| Properties | Type | Description | Examples |  
| ----| ---- | ---- | -----|
| type | `ChartType` | The type of the chart. | `line-chart` |
| spec | `AntVSpec` | The chart attribute information. | |
| score | `number` | The chart score. | |

* ***AntVSpec*** Parameter configuration.

`AntVSpec` is the declarative grammar that supports various technology stacks of AntV. 
See [AntVSpec API](https://github.com/antvis/antv-spec/blob/master/API.md) for detail configurations.

```ts
type AntVSpec = {
  basis: { 
    type: string;
  };
  data: { 
    type: string;
    values: [];
  };
  layer: [
    { 
      encoding;
      mark;
      ...
    }
  ];
};
```

| Properties | Description | Examples |  
| ----| ---- | -----|
| basis | The basic information. | `basis: { type: 'chart' }` |
| data | The data information. | `data: { type: 'json-array', values: [...] }` |
| layer | The drawing information. | `{ [ encoding: { x: {...} , y:{...} }, mark: { type: 'line' } ] }` |


</div>
