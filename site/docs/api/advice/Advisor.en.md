---
title: Advisor
order: 10
---

<embed src='@/docs/common/style.md'></embed>


```sign
Class Advisor(config?: Partial<Pick<Advisor, 'ckbCfg' | 'ruleCfg'>> = {})
```

* **Advisor**: is the tool classes for recommending charts automatically.

`Advisor` provides several main functions, `advise()` is for providing chart recommendation schemas,  `lint()` is for optimizing potential problems in charts.

## Parameters

* **config** * Chart Knowledge Base (ckb) & Rule Config
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

* _**RuleModule**_ `ruler` Custom rules, see [Ruler](./Ruler.en.md) for details.

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

* _**ChartRuleConfigMap**_ `ruler` Rule configuration, see [Ruler](./Ruler.en.md) for details.

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

Get the `Advice[]` of chart recommendation results.

```ts
Advisor.advise(params: AdviseParams): Advice[];
```

See [Advisor.advise](./Advisor-advise.en.md).


### Advisor.lint

Get the `Lint[]` of chart optimization results.

```ts
Advisor.Lint(params: LintParams): Lint[];
```

See [Advisor.lint](./Advisor-lint.en.md)。

### Advisor.getAdviseLog

`Advisor.getAdviseLog` should be used right after [Advisor.Advise](./Advisor-advise.en.md) ，which is used for getting the scoring details of the recommending process。

```ts
Advisor.getAdviseLog(params: AdviseParams): AdvicesWithLog
```

See [Advisor.getAdviseLog](./Advisor-getAdviseLog.en.md)。


### Advisor.getLintLog

`Advisor.getLintLog` should be used right after [Advisor.lint](./Advisor-lint.en.md) ，which is used for getting the scoring details of the optimizing process。

```ts
Advisor.getLintLog(params: LintParams): LintsWithLog
```

详见 [Advisor.getLintLog](./Advisor-getLintLog.en.md)。
