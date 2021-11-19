---
title: Ruler
order: 7
---

`markdown:docs/common/style.md`



`Ruler` is the default set of visual rule definitions within ChartAdvisor.
It does not provide any outward function or syntax.

In order to facilitate user customization of ChartAdvisor, 
we will introduce the relevant interfaces for rule customization in this API file.



## RuleType

* **Interface** *

```ts
type RuleType = 'HARD' | 'SOFT' | 'DESIGN';
```

## BasicDataPropertyForAdvice

* **Interface** *

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

* **Parameters** *

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| name | `string` | Data name. | None `Optional` |
| levelOfMeasurements | `LOM[]` | Level of measurements. | None `Optional` |
| rawData | `any[]` | Source data. | None `Optional` |
| recommendation | `analyzer.FieldInfo['recommendation']` | Recommendation type. | None |
| type | `analyzer.FieldInfo['type']` | Field type. | None |
| distinct | `number` | Distinct value. | None `Optional` |
| count | `number` | Count value. | None `Optional` |
| sum | `number` | Sum value. | None `Optional` |
| maximum | `any` | Max value. | None `Optional` |
| minimum | `any` | Min value. | None `Optional` |
| missing | `number` | Missing value. | None `Optional` |
| [key] | `any` | Customized features. | None `Optional` |

* ***LOM*** Parameter configuration.

```ts
const LOM_OPTIONS: readonly ["Nominal", "Ordinal", 
"Interval", "Discrete", "Continuous", "Time"];
```

* ***recommendation*** Parameter configuration.

```ts
type RecommendationTypes = 'null' | 'boolean' | 
'integer' | 'float' | 'date' | 'string' | 'mixed';
```

* ***type*** Parameter configuration.

```ts
type TypeSpecifics = RecommendationTypes | 'mixed';
```

## Info

* **Interface** *

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

* **Parameters** *

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| chartType | `string` | Chart type. | None `Optional` |
| dataProps | `BasicDataPropertyForAdvice[] | BasicDataPropertyForAdvice` | Basic props. | None |
| purpose | `string` | Recommend purpose. | `false` |
| preferences | `Preferences` | Recommend preferences. | None `Optional` |
| customWeight | `number` | Customized weight. | None `Optional` |
| [key] | `any` | Customized features. | None `Optional` |

* ***purpose*** Parameter configuration.

```ts
type PURPOSE_OPTIONS = ["Comparison", "Trend", "Distribution", "Rank", "Proportion", 
  "Composition", "Relation", "Hierarchy", "Flow", "Spatial", "Anomaly", "Value"];
```

* ***preferences*** Parameter configuration.

```ts
interface Preferences {
  canvasLayout: 'landscape' | 'portrait';
}
```

## Validator

* **Interface** *

```ts
type Validator = (args: Info) => number | boolean;
```

## Trigger

* **Interface** *

```ts
type Trigger = (args: Info) => boolean;
```

## Optimizer

* **Interface** *

```ts
type Optimizer = (
  dataProps: BasicDataPropertyForAdvice[] | BasicDataPropertyForAdvice | Partial<analyzer.GraphProps>,
  chartSpec: AntVSpec
) => object;
```

## ChartRuleID

* **Interface** *

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

* **Interface** *

```ts
const ChartDesignRuleID = ['x-axis-line-fading'];
```

## ChartRuleConfig

* **Interface** *

```ts
interface ChartRuleConfig {
  weight?: number;
  off?: boolean;
}
```

* **Parameters** *

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| weight | `number` | Customized weight. | None `Optional` |
| off | `boolean` | Whether to ignore the rule by default. | None `Optional` |

## ChartRuleConfigMap

* **Interface** *

```ts
type ChartRuleConfigMap = Record<string, ChartRuleConfig>;
```

## Docs

* **Interface** *

```ts
type Docs = {
  lintText?: string;
  detailedText?: string;
  moreLink?: string;
  [key: string]: any;
};
```

* **Parameters** *

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| lintText | `string` | Rule description. | None `Optional` |
| detailedText | `string` | Rule details. | None `Optional` |
| moreLink | `string` | Additional link. | None `Optional` |
| [key] | `any` | Customized features. | None `Optional` |

## DefaultRuleModule

* **Interface** *

```ts
type DefaultRuleModule = {
  id: string;
  docs: Docs;
  trigger: Trigger;
  option?: ChartRuleConfig;
};
```

* **Parameters** *

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| id | `string` | Rule id. | None  |
| docs | `Docs` | Rule description doc. | None  |
| trigger | `Trigger` | Trigger status. | None  |
| option | `ChartRuleConfig` | Rule configurations. | None `Optional` |

## ChartRuleModule

* **Interface** *

```ts
type ChartRuleModule = DefaultRuleModule & {
  type: 'HARD' | 'SOFT';
  validator: Validator;
};
```

## DesignRuleModule

* **Interface** *

```ts
type DesignRuleModule = DefaultRuleModule & {
  type: 'DESIGN';
  optimizer: Optimizer;
};
```

## RuleModule

* **Interface** *

```ts
type RuleModule = ChartRuleModule | DesignRuleModule;
```

## RuleConfig

* **Interface** *

```ts
type RuleConfig = {
  include?: string[];
  exclude?: string[];
  custom?: Record<string, RuleModule>;
  options?: ChartRuleConfigMap;
};
```

* **Parameters** *

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| exclude | `string[]` | Rules to exclude. | None  `Optional` |
| include | `string[]` | Rules to include, with lower property than exclude. | None  `Optional` |
| custom | `Record<string, RuleModule>` | Customized rules. | None  `Optional` |
| option | `ChartRuleConfigMap` | Rule configurations group. | None `Optional` |




