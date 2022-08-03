---
title: ChartAdvisor
order: 0
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

### ChartAdvisor.advise

Get the `Advice[]` of chart recommendation results.

```ts
ChartAdvisor.advise(params: AdviseParams): Advice[];
```

See [ChartAdvisor.advise](./1_ChartAdvisor-advise).

### ChartAdvisor.adviseWithLog

The `ChartAdvisor.adviseWithLog` method does almost exactly the same thing as [ChartAdvisor.advise](./1_ChartAdvisor-advise) except that `ChartAdvisor.advanceWithLog` additionally returns the scoring details of the recommendation process for subsequent interpretation of the recommendation in any application.

```ts
ChartAdvisor.adviseWithLog(params: AdviseParams): AdvicesWithLog
```

详见 [ChartAdvisor.adviseWithLog](./2_ChartAdvisor-adviseWithLog)。
