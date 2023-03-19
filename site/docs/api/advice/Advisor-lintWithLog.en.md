---
title: Advisor.lintWithLog
order: 22
---

<embed src='@/docs/common/style.md'></embed>

```sign
lintWithLog(params: LintParams): LintResult
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

* _**AntVSpec**_ Parameter configuration.

`AntVSpec` is the declarative grammar that supports various technology stacks of AntV. 


| Properties | Description              | Examples                                                           |
| ---------- | ------------------------ | ------------------------------------------------------------------ |
| basis      | The basic information.   | `basis: { type: 'chart' }`                                         |
| data       | The data information.    | `data: { type: 'json-array', values: [...] }`                      |
| layer      | The drawing information. | `{ [ encoding: { x: {...} , y:{...} }, mark: { type: 'line' } ] }` |


* _**BasicDataPropertyForAdvice**_ Parameter configuration, see [Ruler](./Ruler.en.md) for details..

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

* _**LinterOptions**_ Parameter configuration.

| Properties  | Type          | Description                  | Default         |
| ----------- | ------------- | ---------------------------- | --------------- |
| purpose     | `Purpose`     | The purpose of the analysis. | None `Optional` |
| preferences | `Preferences` | Chart preferences.           | None `Optional` |

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

## Return value

```ts
type LintResult = {
  lints: Lint[];
  log: ScoringResultForRule[];
};
```

_`Lint[]`_

* _**Lint**_ Parameter configuration.

| Properties | Type     | Description                      | Examples               |
| ---------- | -------- | -------------------------------- | ---------------------- |
| type       | `string` | Rule type.                       | `hard / soft / design` |
| id         | `string` | Rule id.                         | `10`                   |
| score      | `number` | The score of the rule.           | ` 1`                   |
| fix        | `any`    | The solution based on this rule. |                        |
| docs       | `any`    | The documentation for the rule.  |                        |

_`LintLog`_

```ts
  log: ScoringResultForRule[];
```

* _**LintLog**_ Return Type.

| Properties | Type                                                                   | Optional | Examples | Description                                       |
| ---------- | ---------------------------------------------------------------------- | :------: | -------- | ------------------------------------------------- |
| log        | [ScoringResultForRule][] |          |          | Summary lint scoring records for that chart spec. |

## Examples

```ts
import { Advisor } from '@antv/ava';

const myAdvisor= new Advisor();
const spec = { ...someBadSpec };

const lintResult = myAdvisor.lintWithLog({ spec });
console.log(lintResult.log);
```
