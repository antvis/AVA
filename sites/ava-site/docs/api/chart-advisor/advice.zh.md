---
title: Advisor.advice
order: 1
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
Advisor.advise(params: AdviseParams): ChartList[];
```

### 参数

* **params** * Advisor 配置项
  * _required_
  * `type`: AdviseParams

```ts
type AdviseParams = ChartAdviseParams | GraphAdviseParams;
```

其中，`ChartAdviseParams` 和 `GraphAdviseParams` 分别代表图表推荐和图推荐所需要的参数类型。

#### 统计图表推荐参数

* ***ChartAdviseParams*** 参数配置。

```ts
type ChartAdviseParams = {
  data: [];
  fields?: string[];
  smartColor?: boolean;
  options?: AdvisorOptions;
  colorOptions?: SmartColorOptions;
};
```

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| data | `[]` | 源数据。 | 无 |
| fields | `string[]` | 数据字段信息。 | 无 |
| smartColor | `boolean` | 是否开启智能配色。 | `false` |
| options | `AdvisorOptions` | 统计图表推荐配置项。 | 无 |
| colorOptions | `SmartColorOptions` | 智能配色配置项。 | 无 |

* ***AdvisorOptions*** 参数配置。
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

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| purpose | `Purpose` | 分析目的。 | 无 |
| preferences | `Preferences` | 图表喜好。 | 无 |
| refine | `boolean` | 是否开启可视化规则优化。 | 无 |
| fields | `string[]` | 数据字段信息。 | 无 |
| showLog | `boolean` | 是否展示 Log。 | 无 |
| theme | `Theme` | 指定十六进制颜色。 | 无 |

* ***Purpose*** 参数配置。
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
* ***Preferences*** 参数配置。
```ts
interface Preferences {
  canvasLayout: 'landscape' | 'portrait';
}
```
* ***Theme*** 参数配置。
```ts
type Theme = {
  primaryColor?: string;
};
```

* ***SmartColorOptions*** 参数配置。
```ts
type SmartColorOptions = {
  themeColor?: string;
  colorSchemeType?: ColorSchemeType;
  simulationType?: SimulationType;
}
```
| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| themeColor | `string` | 十六进制主题色。 | `#006f94` |
| colorSchemeType | `ColorSchemeType` | 色板生成模式。 | `monochromatic` |
| simulationType | `SimulationType` | 颜色模拟模式。 | `normal` |

#### 图推荐参数

* ***GraphAdviseParams*** 参数配置。

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

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| data | `[]` | 源数据。 | 无 |
| fields | `{ nodes, links }` | 数据点边信息。 | 无 |
| options | `GraphAdvisorOptions` | 图推荐配置项。 | 无 |

* ***GraphAdvisorOptions*** 参数配置。
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

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| nodeColors | `string[]` | 节点颜色。 | 无 |
| nodeSizeRange | `number[]` | 节点大小范围。 | 无 |
| edgeWidthRange | `number[]` | 边宽度范围。 | 无 |
| extra |  | 指定图相关属性。 | 无 |
| *Key | `string` | 指定点边关系（点、边、源自、指向）的位置。 | 无 |
| AdvisorOptions | `AdvisorOptions` | 同统计图表推荐配置项。 | 无 |



### 返回值

*`ChartList[]`* 

* ***ChartList*** 参数配置。

```ts
type ChartList = {
  type: ChartType;
  spec: AntvSpec;
  score: number;
};
```

| 属性 | 类型 | 描述 | 样例 |  
| ----| ---- | ---- | -----|
| type | `ChartType` | 图表类型。 | `line-chart` |
| spec | `AntvSpec` | 图标属性信息。 |  |
| score | `number` | 图表得分。 |  |

* ***AntvSpec*** 参数配置。
```ts
type AntvSpec = {
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
| 属性 | 描述 | 样例 |  
| ----| ---- | -----|
| basis | 基础信息。 | `basis: { type: 'chart' }` |
| data | 数据信息。 | `data: { type: 'json-array', values: [...] }` |
| layer | 绘制信息。 | `{ [ encoding: { x: {...}, y:{...} }, mark: { type: 'line' } ] }` |



</div>