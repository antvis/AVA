---
title: Advisor.getAdviseLog
order: 12
---

<embed src='@/docs/common/style.md'></embed>

```sign
Advisor.adviseWithLog(): AdviseLog
```

`Advisor.getAdviseLog` 方法 需要用在 [Advisor.advise](./Advisor-advise) 方法之后，用于获取推荐过程中的打分细节，方便在应用中进行后续的解释。

## 返回值

_`AdviseLog`_

```ts
log: ScoringResultForChartType[];
```

* _**AdviseLog**_ 参数配置。

| 属性    | 类型                                                                             | 可选  | 示例 | 描述                                         |
| ------- | -------------------------------------------------------------------------------- | :---: | ---- | -------------------------------------------- |
| log     | [ScoringResultForChartType][] |       |      | 所有图表的汇总打分记录。                     |

## 示例

```ts
import { Advisor } from '@antv/ava';

const data = [
  { f1: 'a', f2: 10 },
  { f1: 'b', f2: 20 },
  { f1: 'c', f2: 30 },
];

const myAdvisor = new Advisor();
const advices = myAdvisor.advise({data});
const log  = myAdvisor.getAdviseLog();
console.log(log);
```
