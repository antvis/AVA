---
title: Linter.lint
order: 6
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
Linter.lint(params: LintParams): Lint[];
```

### Parameters

* **params** * Linter 配置项
  * _required_
  * `type`: LintParams

```ts
interface LintParams {
  spec: AntVSpec;
  dataProps?: BasicDataPropertyForAdvice[];
  options?: LinterOptions;
}
```

其中，`spec`、`dataProps` 和 `options` 分别代表输入图表的语法、图标推荐配置项和 Linter 配置项。

#### Linter parameters

* ***AntVSpec*** Parameter configuration.

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

| Attribute | Description | Sample |  
| ----| ---- | -----|
| basis | The basic information. | `basis: { type: 'chart' }` |
| data | The data information. | `data: { type: 'json-array', values: [...] }` |
| layer | The drawing information. | `{ [ encoding: { x: {...} , y:{...} }, mark: { type: 'line' } ] }` |

`AntVSpec` is the declarative grammar that supports various technology stacks of AntV. See [AntVSpec API](https://github.com/antvis/antv-spec/blob/master/API.md) for detail configurations.


* ***BasicDataPropertyForAdvice*** Parameter configuration.

```ts
interface BasicDataPropertyForAdvice {
  /** field name */
  readonly name?: string;
  /** LOM */
  readonly levelOfMeasurements?: LOM[];
  /** used for split column xy series */
  readonly rawData: any[];
  /** required types in analyzer FieldInfo */
  readonly recommendation: analyzer.FieldInfo['recommendation'];
  readonly type: analyzer.FieldInfo['type'];
  readonly distinct?: number;
  readonly count?: number;
  readonly sum?: number;
  readonly maximum?: any;
  readonly minimum?: any;
  readonly missing?: number;
  // for customized props
  [key: string]: any;
}
```

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| name | `string` | The name of the field. | None |
| levelOfMeasurements | `LOM[]` | Level of measurement. | None |
| rawData | `[]` | The source data. | None |
| recommendation | `analyzer.FieldInfo['recommendation']` | Recommendation type. | None |
| type | `analyzer.FieldInfo['type']` | Field type. | None
| distinct | `number` | Value of distinct data. | None | 
| count | `number` | Count value. | None |
| sum | `number` | Sum value. | None |
| maximum | `any` | Max value. | None |
| minimum | `any` | Min value. | None |
| missing | `number` | Missing value. | None |
| [key] | `any` | Custom property. | None |

* ***LOM*** Parameter configuration.

```ts
const LOM_OPTIONS: readonly ["Nominal", "Ordinal", "Interval", "Discrete", "Continuous", "Time"];
```

* ***recommendation*** Parameter configuration.

```ts
type RecommendationTypes = 'null' | 'boolean' | 'integer' | 'float' | 'date' | 'string' | 'mixed';
```

* ***type*** Parameter configuration.

```ts
type TypeSpecifics = RecommendationTypes | 'mixed';
```

* ***LinterOptions*** Parameter configuration.

```ts
type LinterOptions = {
  purpose?: Purpose;
  preferences?: Preferences;
};
```

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| purpose | `Purpose` | The purpose of the analysis. | None |
| preferences | `Preferences` | Chart preferences. | None |

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


### Return value

*`Lint[]`* 

* ***Lint*** Parameter configuration.

```ts
interface Lint {
  type: string;
  id: string;
  score: number;
  fix?: any;
  docs?: any;
}
```

| Properties | Type | Description | Examples |  
| ----| ---- | ---- | -----|
| type | `string` | Rule type. | hard / soft / design
| id | `string` | Rule id. | `10` |
| score | `number` | The score of the rule. | ` 1` |
| fix | `any` | The solution based on this rule. | |
| docs | `any` | The documentation for the rule. | | |


</div>
