---
title: Linter.lint
order: 6
---

`markdown:docs/common/style.md`



```sign
Linter.lint(params: LintParams): Lint[];
```

## Parameters

* **params** * Linter configuration.
  * _required_
  * `type`: LintParams

```ts
interface LintParams {
  spec: AntVSpec;
  dataProps?: BasicDataPropertyForAdvice[];
  options?: LinterOptions;
}
```

Among above, `spec`, `dataProps` and `options` represent the input chart syntax, 
chart recommendation configuration items and Linter configuration items, respectively.

### Linter parameters

* ***AntVSpec*** Parameter configuration.

`AntVSpec` is the declarative grammar that supports various technology stacks of AntV. 
See [AntVSpec API](https://github.com/antvis/antv-spec/blob/master/API.md) for detail configurations.

| Properties | Description | Examples |  
| ----| ---- | -----|
| basis | The basic information. | `basis: { type: 'chart' }` |
| data | The data information. | `data: { type: 'json-array', values: [...] }` |
| layer | The drawing information. | `{ [ encoding: { x: {...} , y:{...} }, mark: { type: 'line' } ] }` |


* ***BasicDataPropertyForAdvice*** Parameter configuration, see [Ruler](./Ruler) for details..

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

* ***LinterOptions*** Parameter configuration.

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| purpose | `Purpose` | The purpose of the analysis. | None `Optional` |
| preferences | `Preferences` | Chart preferences. | None `Optional` |

* ***Purpose*** Parameter configuration.

```ts
type PURPOSE_OPTIONS = ["Comparison", "Trend", "Distribution", "Rank", "Proportion", 
  "Composition", "Relation", "Hierarchy", "Flow", "Spatial", "Anomaly", "Value"];
```

* ***Preferences*** Parameter configuration.

```ts
interface Preferences {
  canvasLayout: 'landscape' | 'portrait';
}
```


## Return value

*`Lint[]`* 

* ***Lint*** Parameter configuration.

| Properties | Type | Description | Examples |  
| ----| ---- | ---- | -----|
| type | `string` | Rule type. | `hard / soft / design` |
| id | `string` | Rule id. | `10` |
| score | `number` | The score of the rule. | ` 1` |
| fix | `any` | The solution based on this rule. | |
| docs | `any` | The documentation for the rule. | |



