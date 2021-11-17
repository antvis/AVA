---
title: Advisor
order: 3
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
Class Advisor(config?: Partial<Pick<Advisor, 'ckbCfg' | 'ruleCfg'>> = {})
```

### Parameters

* **config** * Chart Knowledge Base (CKB) & Rule Config
  * _optional_
  * `Parameter type`: CKBConfig | RuleConfig object

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| ckbCfg | `CKBConfig` | CKB configuration. | `@antv/ckb` |
| ruleCfg | `RuleConfig` | Rule configuration. | Built-in rules `ruler` |


* ***CKBConfig*** CKB configuration.

```ts
type CKBConfig = {
  exclude?: string[];
  include?: string[];
  custom?: Record<string, CustomizedCKBJSON>;
};
```

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| exclude | `string[]` | Specify to exclude charts in `@antv/ckb`. | None |
| include | `string[]` | Specify to include charts, with lower priority than exclude. | None |
| custom | `Record<string, CustomizedCKBJSON>` | Customized charts. | None |

* ***CustomizedCKBJSON*** `@antv/ckb` Customized charts, see [ChartKnowledgeJSON API](./ckb/CKBJson#parameters) for details.


* ***RuleConfig*** Chart rule configuration.

```ts
type RuleConfig = {
  include?: string[];
  exclude?: string[];
  custom?: Record<string, RuleModule>;
  options?: ChartRuleConfigMap;
};
```

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| exclude | `string[]` | Specify to exclude rules in `ruler`. | None |
| include | `string[]` | Specify to include rules, with lower priority than exclude. | None |
| custom | `Record<string, RuleModule>` | Customized rules. | None |
| options | `ChartRuleConfigMap` | Rule configuration. | None |

* ***RuleModule*** `ruler` Custom rules, see [Ruler](../ckb/Ruler) for details.

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

* ***ChartRuleConfigMap*** `ruler` Rule configuration

```ts
type ChartRuleConfigMap = Record<string, ChartRuleConfig>;

interface ChartRuleConfig {
  weight?: number;
  off?: boolean;
}
```

### Function

#### Advisor.advise

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


</div>
