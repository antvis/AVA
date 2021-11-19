---
title: Ruler
order: 7
---

`markdown:docs/common/style.md`



`Ruler` 是 ChartAdvisor 内部默认的可视化规则定义集合，不包含向外透出函数。

为了便于用户定制 ChartAdvisor，我们将在本 API 文档中介绍规则定制相关的接口参数。

## RuleType

* **接口描述** *

```ts
type RuleType = 'HARD' | 'SOFT' | 'DESIGN';
```

## BasicDataPropertyForAdvice

* **接口描述** *

```ts
interface BasicDataPropertyForAdvice {
  readonly name?: string;
  readonly levelOfMeasurements?: LOM[];
  readonly rawData: any[];
  readonly recommendation: analyzer.FieldInfo['recommendation'];
  readonly type: analyzer.FieldInfo['type'];
  readonly distinct?: number;
  readonly count?: number;
  readonly sum?: number;
  readonly maximum?: any;
  readonly minimum?: any;
  readonly missing?: number;
  [key: string]: any;
}
```

* **参数配置** *

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| name | `string` | 数据名。 | 无 `可选` |
| levelOfMeasurements | `LOM[]` | 测量尺度。 | 无 `可选` |
| rawData | `any[]` | 源数据。 | 无 |
| recommendation | `analyzer.FieldInfo['recommendation']` | 推荐类型。 | 无 |
| type | `analyzer.FieldInfo['type']` | 字段类型。 | 无 |
| distinct | `number` | 去重计数。 | 无 `可选` |
| count | `number` | 计数。 | 无 `可选` |
| sum | `number` | 总计。 | 无 `可选` |
| maximum | `any` | 最大值。 | 无 `可选` |
| minimum | `any` | 最小值。 | 无 `可选` |
| missing | `number` | 缺失值。 | 无 `可选` |
| [key] | `any` | 自定义属性。 | 无 `可选` |

* ***LOM*** 参数配置。

```ts
const LOM_OPTIONS: readonly ["Nominal", "Ordinal", 
"Interval", "Discrete", "Continuous", "Time"];
```

* ***recommendation*** 参数配置。

```ts
type RecommendationTypes = 'null' | 'boolean' | 
'integer' | 'float' | 'date' | 'string' | 'mixed';
```

* ***type*** 参数配置。

```ts
type TypeSpecifics = RecommendationTypes | 'mixed';
```

## Info

* **接口描述** *

```ts
interface Info {
  chartType?: string;
  dataProps: BasicDataPropertyForAdvice[] | BasicDataPropertyForAdvice;
  purpose?: string;
  preferences?: Preferences;
  customWeight?: number;
  [key: string]: any;
}
```

* **参数配置** *

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| chartType | `string` | 图表类型。 | 无 `可选` |
| dataProps | `BasicDataPropertyForAdvice[] | BasicDataPropertyForAdvice` | 基本数据属性。 | 无 |
| purpose | `string` | 推荐目的。 | `false` |
| preferences | `Preferences` | 推荐偏好。 | 无 `可选` |
| customWeight | `number` | 自定义权重。 | 无 `可选` |
| [key] | `any` | 自定义属性。 | 无 `可选` |

* ***purpose*** 参数配置。

```ts
type PURPOSE_OPTIONS = ["Comparison", "Trend", "Distribution", "Rank", "Proportion", 
  "Composition", "Relation", "Hierarchy", "Flow", "Spatial", "Anomaly", "Value"];
```

* ***preferences*** 参数配置。

```ts
interface Preferences {
  canvasLayout: 'landscape' | 'portrait';
}
```

## Validator

* **接口描述** *

```ts
type Validator = (args: Info) => number | boolean;
```

## Trigger

* **接口描述** *

```ts
type Trigger = (args: Info) => boolean;
```

## Optimizer

* **接口描述** *

```ts
type Optimizer = (
  dataProps: BasicDataPropertyForAdvice[] | BasicDataPropertyForAdvice | Partial<analyzer.GraphProps>,
  chartSpec: AntVSpec
) => object;
```

## ChartRuleID

* **接口描述** *

```ts
const ChartRuleID = [
  'data-check',
  'data-field-qty',
  'no-redundant-field',
  'purpose-check',
  'series-qty-limit',
  'bar-series-qty',
  'line-field-time-ordinal',
  'landscape-or-portrait',
  'diff-pie-sector',
  'nominal-enum-combinatorial',
  'limit-series',
  'aggregation-single-row',
  'all-can-be-table',
];
```

## ChartDesignRuleID

* **接口描述** *

```ts
const ChartDesignRuleID = ['x-axis-line-fading'];
```

## ChartRuleConfig

* **接口描述** *

```ts
interface ChartRuleConfig {
  weight?: number;
  off?: boolean;
}
```

* **参数配置** *

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| weight | `number` | 自定义规则权重。 | 无 `可选` |
| off | `boolean` | 是否默认忽视该规则。 | 无 `可选` |

## ChartRuleConfigMap

* **接口描述** *

```ts
type ChartRuleConfigMap = Record<string, ChartRuleConfig>;
```

## Docs

* **接口描述** *

```ts
type Docs = {
  lintText?: string;
  detailedText?: string;
  moreLink?: string;
  [key: string]: any;
};
```

* **参数配置** *

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| lintText | `string` | 描述文字。 | 无 `可选` |
| detailedText | `string` | 详细文字。 | 无 `可选` |
| moreLink | `string` | 附加链接。 | 无 `可选` |
| [key] | `any` | 自定义属性。 | 无 `可选` |

## DefaultRuleModule

* **接口描述** *

```ts
type DefaultRuleModule = {
  id: string;
  docs: Docs;
  trigger: Trigger;
  option?: ChartRuleConfig;
};
```

* **参数配置** *

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| id | `string` | 规则 id。 | 无  |
| docs | `Docs` | 规则描述文档。 | 无  |
| trigger | `Trigger` | 触发态。 | 无  |
| option | `ChartRuleConfig` | 规则配置项。 | 无 `可选` |

## ChartRuleModule

* **接口描述** *

```ts
type ChartRuleModule = DefaultRuleModule & {
  type: 'HARD' | 'SOFT';
  validator: Validator;
};
```

## DesignRuleModule

* **接口描述** *

```ts
type DesignRuleModule = DefaultRuleModule & {
  type: 'DESIGN';
  optimizer: Optimizer;
};
```

## RuleModule

* **接口描述** *

```ts
type RuleModule = ChartRuleModule | DesignRuleModule;
```

## RuleConfig

* **接口描述** *

```ts
type RuleConfig = {
  include?: string[];
  exclude?: string[];
  custom?: Record<string, RuleModule>;
  options?: ChartRuleConfigMap;
};
```

* **参数配置** *

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| exclude | `string[]` | 指定不包含的规则。 | 无  `可选` |
| include | `string[]` | 指定包含的规则，优先级低于 exclude。 | 无  `可选` |
| custom | `Record<string, RuleModule>` | 自定义规则。 | 无  `可选` |
| option | `ChartRuleConfigMap` | 规则配置项组。 | 无 `可选` |




