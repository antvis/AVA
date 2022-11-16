---
title: Linter.LintWithLog
order: 22
---

<embed src='@/docs/common/style.md'></embed>

```sign
lintWithLog(params: LintParams): LintsWithLog
```

The `Linter.lintWithLog` method does almost exactly the same thing as [Linter.lint](./21_Linter-lint) except that it additionally returns the scoring details of the recommendation process for subsequent interpretation of the recommendation in any application.

## Parameters

* **params** Linter configurations
  * _required_
  * `type`: LintParams

See [Linter.lint](./21_Linter-lint#parameters).

## Return value

_`LintsWithLog`_

```ts
interface LintsWithLog {
  lints: Lint[];
  log: ScoringResultForRule[];
}
```

* _**LintsWithLog**_ Parameter configuration.

| Properties | Type                                                                   | Optional | Examples | Description                                       |
| ---------- | ---------------------------------------------------------------------- | :------: | -------- | ------------------------------------------------- |
| lints      | [Lint](../types/3_ChartAdvisor#lint)[]                                 |          |          | All linting problems, same results as Linter.lint |
| log        | [ScoringResultForRule](../types/3_ChartAdvisor#scoringresultforrule)[] |          |          | Summary lint scoring records for that chart spec. |

## Examples

```ts
import { Linter } from '@antv/chart-advisor';

const myLinter = new Linter();
const spec = { ...someBadSpec };

const { lints, log } = myLinter.lintWithLog({ spec });
console.log(lints);
console.log(log);
```
