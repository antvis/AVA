---
title: Advisor.getLintLog
order: 22
---

<embed src='@/docs/common/style.md'></embed>

```sign
getLintLog(): LintLog
```

`Advisor.getLintLog` should be used right after [Advisor.lint](./Advisor-lint) ，which is used for getting the scoring details of the optimizing process。

## Return value

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

const lints = myAdvisor.lint({ spec });
const log = myAdvisor.getLintLog();
console.log(log);
```
