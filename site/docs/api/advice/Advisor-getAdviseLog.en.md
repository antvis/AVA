---
title: Advisor.getAdviseLog
order: 12
---

<embed src='@/docs/common/style.md'></embed>

```sign
Advisor.getAdviseLog(params: AdviseParams): AdviseLog
```

`Advisor.getAdviseLog` should be used right after [Advisor.Advise](./Advisor-Advise) ，which is used for getting the scoring details of the recommending process。


## Return value

_`AdviseLog`_

```ts
log: ScoringResultForChartType[];
```

* _**getAdviseLog**_ Parameter configuration.

| Properties | Type                                                                             | Optional | Examples | Description                                         |
| ---------- | -------------------------------------------------------------------------------- | :------: | -------- | --------------------------------------------------- |
| log        | [ScoringResultForChartType][] |          |          | Summary scoring records for all chart types.        |

## Examples

```ts
import { Advisor } from '@antv/ava';

const myAdvisor = new Advisor();
const data = [
  { f1: 'a', f2: 10 },
  { f1: 'b', f2: 20 },
  { f1: 'c', f2: 30 },
];

const advices = myAdvisor.advise({data});
const log = myAdvisor.getAdviseLog();
console.log(advices);
console.log(log);
```
