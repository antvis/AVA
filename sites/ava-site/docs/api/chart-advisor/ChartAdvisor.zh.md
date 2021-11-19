---
title: ChartAdvisor
order: 1
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

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| ckbCfg | `CKBConfig` | 图表知识库配置。 | `@antv/ckb` |
| ruleCfg | `RuleConfig` | 图表规则配置。 | 内置规则 `ruler` |


* ***CKBConfig*** 图表知识库参数配置。

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| exclude | `string[]` | 指定不包含 `@antv/ckb` 中的图表。 | 无  `可选` |
| include | `string[]` | 指定包含的图表，优先级低于 exclude。 | 无  `可选` |
| custom | `Record<string, CustomizedCKBJSON>` | 自定义图表。 | 无  `可选` |

* ***CustomizedCKBJSON*** `@antv/ckb` 自定义图表，详见 [ChartKnowledgeJSON API](../ckb/CKBJson#参数)。


* ***RuleConfig*** 图表规则参数配置。

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| exclude | `string[]` | 指定不包含的 `ruler` 规则。 | 无  `可选` |
| include | `string[]` | 指定包含的规则，优先级低于 exclude。 | 无  `可选` |
| custom | `Record<string, RuleModule>` | 自定义规则。 | 无  `可选` |
| options | `ChartRuleConfigMap` | 规则配置。 | 无  `可选` |

* ***RuleModule*** `ruler` 自定义规则，详见 [Ruler](./Ruler)。

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

* ***ChartRuleConfigMap*** `ruler` 规则配置，详见 [Ruler](./Ruler)。

```ts
type ChartRuleConfigMap = Record<string, ChartRuleConfig>;

interface ChartRuleConfig {
  weight?: number;
  off?: boolean;
}
```

## 方法

### ChartAdvisor.advise

获得图表推荐结果的 `ChartAdvisorList[]`，详见 [ChartAdvisor.advise](./chartAdvice)。

```ts
ChartAdvisor.advise(params: AdviseParams): ChartAdvisorList[];
```

参数：

```ts
type AdviseParams = ChartAdviseParams | GraphAdviseParams;
```

返回值：

```ts
type ChartAdvisorList = {
  type: ChartType;
  spec: AntVSpec;
  lint: Lint;
  score: number;
};
```



