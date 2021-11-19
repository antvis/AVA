---
title: Advisor
order: 3
---

`markdown:docs/common/style.md`



```sign
Class Advisor(config?: Partial<Pick<ChartAdvisor, 'ckbCfg' | 'ruleCfg'>> = {})
```

* **Advisor**: 是对应图表推荐的工具类。

`Advisor` 提供了 `advise()` 函数用于提供图表推荐配置项。

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

### Advisor.advise

获得图表推荐结果的 `AdvisorList[]`，详见 [Advisor.advise](./advice).

```ts
Advisor.advise(params: AdviseParams): AdvisorList[];
```

参数：

```ts
type AdviseParams = ChartAdviseParams | GraphAdviseParams;
```

返回值：

```ts
type AdvisorList = {
  type: ChartType;
  spec: AntVSpec;
  score: number;
};
```



