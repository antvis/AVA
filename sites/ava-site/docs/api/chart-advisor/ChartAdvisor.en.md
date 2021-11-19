---
title: ChartAdvisor
order: 1
---

`markdown:docs/common/style.md`



```sign
Class ChartAdvisor(config?: Partial<Pick<ChartAdvisor, 'ckbCfg' | 'ruleCfg'>> = {})
```

* **ChartAdvisor**: is a tool class that contains both chart recommendation and chart optimization abilities.

`ChartAdvisor` contains both an `Advisor` and a `Linter` object, and provides `advise()` function,
compared to `Advisor`, it provides an additional `Lint` object as output for providing chart suggestions.

## Parameters

* **config** * Chart Knowledge Base (CKB) & Rule Config
  * _optional_
  * `Parameter type`: CKBConfig | RuleConfig object

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| ckbCfg | `CKBConfig` | CKB configuration. | `@antv/ckb` |
| ruleCfg | `RuleConfig` | Rule configuration. | Built-in rules `ruler` |


* ***CKBConfig*** CKB configuration.

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| exclude | `string[]` | Specify to exclude charts in `@antv/ckb`. | None `Optional` |
| include | `string[]` | Specify to include charts, with lower priority than exclude. | None `Optional` |
| custom | `Record<string, CustomizedCKBJSON>` | Customized charts. | None `Optional` |

* ***CustomizedCKBJSON*** `@antv/ckb` Customized charts, see [ChartKnowledgeJSON API](./ckb/CKBJson#parameters) for details.


* ***RuleConfig*** Chart rule configuration.

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| exclude | `string[]` | Specify to exclude rules in `ruler`. | None `Optional` |
| include | `string[]` | Specify to include rules, with lower priority than exclude. | None `Optional` |
| custom | `Record<string, RuleModule>` | Customized rules. | None `Optional` |
| options | `ChartRuleConfigMap` | Rule configuration. | None `Optional` |

* ***RuleModule*** `ruler` Custom rules, see [Ruler](./Ruler) for details.

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

* ***ChartRuleConfigMap*** `ruler` Rule configuration, see [Ruler](./Ruler) for details.

```ts
type ChartRuleConfigMap = Record<string, ChartRuleConfig>;

interface ChartRuleConfig {
  weight?: number;
  off?: boolean;
}
```

## Function

### ChartAdvisor.advise

Get the `ChartAdvisorList[]` of chart recommendation results as detailed in [ChartAdvisor.advise](./chartAdvice).

```ts
ChartAdvisor.advise(params: AdviseParams): ChartAdvisorList[];
```

Parameter:

```ts
type AdviseParams = ChartAdviseParams | GraphAdviseParams;
```

Return value:

```ts
type ChartAdvisorList = {
  type: ChartType;
  spec: AntVSpec;
  lint: Lint;
  score: number;
};
```



