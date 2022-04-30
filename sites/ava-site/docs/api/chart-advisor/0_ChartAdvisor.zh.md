---
title: ChartAdvisor
order: 0
---

`markdown:docs/common/style.md`



```sign
Class ChartAdvisor(config?: Partial<Pick<ChartAdvisor, 'ckbCfg' | 'ruleCfg'>> = {})
```

* **ChartAdvisor**: 是一个同时包含图表推荐和图表优化功能的工具类。

`ChartAdvisor` 中同时包含了一个 `Advisor` 和一个 `Linter` 对象，并提供了 `advise()` 函数用于图表推荐和优化，
相对于 `Advisor` 中的同名函数多了一个 `Lint` 类型的输出作为图表优化建议项。

## 参数

* **config** * 图表和规则配置
  * _可选参数_
  * `参数类型`: CKBConfig | RuleConfig 对象

| 属性    | 类型         | 描述             | 默认值           |
| ------- | ------------ | ---------------- | ---------------- |
| ckbCfg  | `CKBConfig`  | 图表知识库配置。 | `@antv/ckb`      |
| ruleCfg | `RuleConfig` | 图表规则配置。   | 内置规则 `ruler` |


* _**CKBConfig**_ 图表知识库参数配置。

| 属性    | 类型                                | 描述                                 | 默认值     |
| ------- | ----------------------------------- | ------------------------------------ | ---------- |
| exclude | `string[]`                          | 指定不包含 `@antv/ckb` 中的图表。    | 无  `可选` |
| include | `string[]`                          | 指定包含的图表，优先级低于 exclude。 | 无  `可选` |
| custom  | `Record<string, CustomizedCKBJSON>` | 自定义图表。                         | 无  `可选` |

* _**CustomizedCKBJSON**_ `@antv/ckb` 自定义图表，详见 [ChartKnowledgeJSON API](../ckb/CKBJson#参数)。


* _**RuleConfig**_ 图表规则参数配置。

| 属性    | 类型                         | 描述                                 | 默认值     |
| ------- | ---------------------------- | ------------------------------------ | ---------- |
| exclude | `string[]`                   | 指定不包含的 `ruler` 规则。          | 无  `可选` |
| include | `string[]`                   | 指定包含的规则，优先级低于 exclude。 | 无  `可选` |
| custom  | `Record<string, RuleModule>` | 自定义规则。                         | 无  `可选` |
| options | `ChartRuleConfigMap`         | 规则配置。                           | 无  `可选` |

* _**RuleModule**_ `ruler` 自定义规则，详见 [Ruler](./30_Ruler)。

```ts
type RuleModule = ChartRuleModule | DesignRuleModule;

type ChartRuleModule = DefaultRuleModule & {
  type: 'HARD' | 'SOFT';
  validator: Validator;
};

type DesignRuleModule = DefaultRuleModule & {
  type: 'DESIGN';
  optimizer: Optimizer;
};
```

* _**ChartRuleConfigMap**_ `ruler` 规则配置，详见 [Ruler](./30_Ruler)。

```ts
type ChartRuleConfigMap = Record<string, ChartRuleConfig>;

interface ChartRuleConfig {
  weight?: number;
  off?: boolean;
}
```

## 方法

### ChartAdvisor.advise

获得图表推荐结果.

```ts
ChartAdvisor.advise(params: AdviseParams): Advice[];
```

详见 [ChartAdvisor.advise](./1_ChartAdvisor-advise)。

### ChartAdvisor.adviseWithLog

作用和 [ChartAdvisor.advise](./1_ChartAdvisor-advise) 几乎完全相同。只不过会额外地将推荐过程中的打分细节一并返回，方便在应用中进行后续的推荐解释。

```ts
ChartAdvisor.adviseWithLog(params: AdviseParams): AdvicesWithLog
```

详见 [ChartAdvisor.adviseWithLog](./2_ChartAdvisor-adviseWithLog)。
