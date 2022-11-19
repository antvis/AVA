---
title: Advisor
order: 10
---

<embed src='@/docs/common/style.md'></embed>


```sign
Class Advisor(config?: Partial<Pick<Advisor, 'ckbCfg' | 'ruleCfg'>> = {})
```

* **Advisor**: is the tool classes for recommending charts automatically.

`Advisor` provides `advise()` function for providing chart recommendation schemas.

## Parameters

* **config** * Chart Knowledge Base (CKB) & Rule Config
  * _optional_
  * `Parameter type`: CKBConfig | RuleConfig object

| Properties | Type         | Description         | Default                |
| ---------- | ------------ | ------------------- | ---------------------- |
| ckbCfg     | `CKBConfig`  | CKB configuration.  | `@antv/ckb`            |
| ruleCfg    | `RuleConfig` | Rule configuration. | Built-in rules `ruler` |


* _**CKBConfig**_ CKB configuration.

| Properties | Type                                | Description                                                  | Default         |
| ---------- | ----------------------------------- | ------------------------------------------------------------ | --------------- |
| exclude    | `string[]`                          | Specify to exclude charts in `@antv/ckb`.                    | None `Optional` |
| include    | `string[]`                          | Specify to include charts, with lower priority than exclude. | None `Optional` |
| custom     | `Record<string, CustomizedCKBJSON>` | Customized charts.                                           | None `Optional` |

* _**CustomizedCKBJSON**_ `@antv/ckb` Customized charts, see [ChartKnowledgeJSON API](./ckb/CKBJson#parameters) for details.


* _**RuleConfig**_ Chart rule configuration.

| Properties | Type                         | Description                                                 | Default         |
| ---------- | ---------------------------- | ----------------------------------------------------------- | --------------- |
| exclude    | `string[]`                   | Specify to exclude rules in `ruler`.                        | None `Optional` |
| include    | `string[]`                   | Specify to include rules, with lower priority than exclude. | None `Optional` |
| custom     | `Record<string, RuleModule>` | Customized rules.                                           | None `Optional` |
| options    | `ChartRuleConfigMap`         | Rule configuration.                                         | None `Optional` |

* _**RuleModule**_ `ruler` Custom rules, see [Ruler](./30_Ruler) for details.

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

* _**ChartRuleConfigMap**_ `ruler` Rule configuration, see [Ruler](./30_Ruler) for details.

```ts
type ChartRuleConfigMap = Record<string, ChartRuleConfig>;

interface ChartRuleConfig {
  weight?: number;
  off?: boolean;
  extra?: Record<string, any>;
}
```

## Function

### Advisor.advise

Get the `AdvisorList[]` of chart recommendation results.

```ts
Advisor.advise(params: AdviseParams): AdvisorList[];
```

See [Advisor.advise](./11_Advisor-advise).

### Advisor.adviseWithLog

This method does almost exactly the same thing as [Advisor.advise](./11_Advisor-advise) except that it additionally returns the scoring details of the recommendation process for subsequent interpretation of the recommendation in any application.

```ts
Advisor.adviseWithLog(params: AdviseParams): AdvicesWithLog
```

See [Advisor.adviseWithLog](./12_Advisor-adviseWithLog)。
