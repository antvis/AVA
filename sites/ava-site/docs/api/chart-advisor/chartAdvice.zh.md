---
title: ChartAdvisor.advise
order: 2
---

`markdown:docs/common/style.md`



```sign
ChartAdvisor.advise(params: AdviseParams): ChartAdvisorList[];
```

## 参数

* **params** * ChartAdvisor 配置项
  * _必选参数_
  * `参数类型`: AdviseParams 对象

```ts
type AdviseParams = ChartAdviseParams | GraphAdviseParams;
```

其中，`ChartAdviseParams` 和 `GraphAdviseParams` 分别代表图表推荐和图推荐所需要的参数类型。

### 统计图表推荐参数

* ***ChartAdviseParams*** 参数配置。

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| data | `any[]` | 源数据。 | 无 |
| fields | `string[]` | 数据字段信息。 | 无 `可选` |
| smartColor | `boolean` | 是否开启智能配色。 | `false` `可选` |
| options | `AdvisorOptions` | 统计图表推荐配置项。 | 无 `可选` |
| colorOptions | `SmartColorOptions` | 智能配色配置项。 | 无 `可选` |

* ***AdvisorOptions*** 参数配置。


| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| purpose | `Purpose` | 分析目的。 | 无 `可选` |
| preferences | `Preferences` | 图表喜好。 | 无 `可选` |
| refine | `boolean` | 是否开启可视化规则优化。 | 无 `可选` |
| fields | `string[]` | 数据字段信息。 | 无 `可选` |
| showLog | `boolean` | 是否展示 Log。 | 无 `可选` |
| theme | `Theme` | 指定十六进制颜色。 | 无 `可选` |

* ***Purpose*** 参数配置。

```ts
type PURPOSE_OPTIONS = ["Comparison", "Trend", "Distribution", "Rank", "Proportion", 
  "Composition", "Relation", "Hierarchy", "Flow", "Spatial", "Anomaly", "Value"];
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
| themeColor | `string` | 十六进制主题色。 | `#006f94` `可选` |
| colorSchemeType | `ColorSchemeType` | 色板生成模式。 | `monochromatic` `可选` |
| simulationType | `SimulationType` | 颜色模拟模式。 | `normal` `可选` |

### 图推荐参数

* ***GraphAdviseParams*** 参数配置。

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| data | `any[]` | 源数据。 | 无 |
| fields | `{ nodes: string[];, links: string[]; }` | 数据点边信息。 | 无 `可选` |
| options | `GraphAdvisorOptions` | 图推荐配置项。 | 无 `可选` |

* ***GraphAdvisorOptions*** 参数配置。

```ts
type GraphAdvisorOptions = {
  nodeColors?: string[];
  nodeSizeRange?: number[];
  edgeWidthRange?: number[];
  extra?: {
    nodeKey?: string;
    edgeKey?: string;
    sourceKey?: string;
    targetKey?: string;
    childrenKey?: string;
  };
  ...AdvisorOptions;
};
```

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| nodeColors | `string[]` | 节点颜色。 | 无 `可选` |
| nodeSizeRange | `number[]` | 节点大小范围。 | 无 `可选` |
| edgeWidthRange | `number[]` | 边宽度范围。 | 无 `可选` |
| extra | `{ *Key, ...}` | 指定图相关属性。 | 无 `可选` |
| *Key | `string` | 指定点边关系（点、边、源自、指向）的位置。 | 无 `可选` |
| AdvisorOptions | `AdvisorOptions` | 同统计图表推荐配置项。 | 无 `可选` |


## 返回值

*`ChartAdvisorList[]`* 

* ***ChartAdvisorList*** 参数配置。

| 属性 | 类型 | 描述 | 样例 |  
| ----| ---- | ---- | -----|
| type | `ChartType` | 图表类型。 | `line-chart` |
| spec | `AntVSpec` | 图表属性信息。 | 见下文 |
| lint | `Lint` | 图表优化建议。 | 见下文 |
| score | `number` | 图表得分。 | `1.0` |

* ***AntVSpec*** 参数配置。

`AntVSpec` 是 AntV 技术栈的声明式语法。
详细配置项见 [AntVSpec API](https://github.com/antvis/antv-spec/blob/master/API.md)。

| 属性 | 描述 | 样例 |  
| ----| ---- | -----|
| basis | 基础信息。 | `basis: { type: 'chart' }` |
| data | 数据信息。 | `data: { type: 'json-array', values: [...] }` |
| layer | 绘制信息。 | `{ [ encoding: { x: {...}, y:{...} }, mark: { type: 'line' } ] }` |


* ***Lint*** 参数配置。


| 属性 | 类型 | 描述 | 样例 |  
| ----| ---- | ---- | -----|
| type | `string` | 规则类型。 | `hard / soft / design` |
| id | `string` | 规则 id。 | `10` |
| score | `number` | 该规则的得分。 | `1` |
| fix | `any` | 基于该规则的解决方案。 |  |
| docs | `any` | 该规则的相关文档。 |  |




