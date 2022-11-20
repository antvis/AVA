---
title: Advisor.getLintLog
order: 22
---

<embed src='@/docs/common/style.md'></embed>

```sign
getLintLog(): LintLog
```

`Advisor.getLintLog` 方法需要用在 [Advisor.lint](./Advisor-lint) 方法之后，用于获取查错过程中的打分细节，方便在应用中进行后续的解释。

## 返回值

_`LintLog`_

```ts
log: ScoringResultForRule[];
```

* _**Log**_ 返回值类型.

| 属性  | 类型                                                                   | 可选  | 示例 | 描述                                        |
| ----- | ---------------------------------------------------------------------- | :---: | ---- | ------------------------------------------- |
| log   | [ScoringResultForRule][] |       |      | 针对给定 Specification 的所有汇总检测记录。 |

## 示例

```ts
import { Advisor } from '@antv/ava';

const myAdvisor= new Advisor();
const spec = { ...someBadSpec };

const lints = myAdvisor.lint({ spec });
const log = myAdvisor.getLintLog();
console.log(log);
```
