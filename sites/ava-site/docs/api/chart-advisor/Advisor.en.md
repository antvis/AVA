---
title: Advisor
order: 3
---

`markdown:docs/common/style.md`



```sign
Class Advisor(config?: Partial<Pick<Advisor, 'ckbCfg' | 'ruleCfg'>> = {})
```

* **Advisor**: is the tool classes for recommending charts automatically.

`Advisor` provides `advise()` function for providing chart recommendation schemas.

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

### Advisor.advise

Get the `AdvisorList[]` of chart recommendation results as detailed in [Advisor.advise](./advice).

```ts
Advisor.advise(params: AdviseParams): AdvisorList[];
```

Parameter:

```ts
type AdviseParams = ChartAdviseParams | GraphAdviseParams;
```

Return value:

```ts
type AdvisorList = {
  type: ChartType;
  spec: AntVSpec;
  score: number;
};
```



