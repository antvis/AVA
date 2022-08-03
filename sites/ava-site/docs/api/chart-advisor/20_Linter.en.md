---
title: Linter
order: 20
---

`markdown:docs/common/style.md`



```sign
Class Linter(ruleCfg?: RuleConfig)
```

* **Linter**: is the tool classes for providing chart optimization suggestions.

`Linter` provides `lint()` function for providing chart optimization suggestions.

## Parameters

* **ruleCfg** * Chart rule Config
  * _optional_
  * `Parameter type`: RuleConfig object

* _**RuleConfig**_ Parameter configuration.

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

### Linter.lint

Get the `Lint[]` of chart optimization suggestions.

```ts
Linter.lint(params: LintParams): Lint[];
```

See [Linter.lint](./21_Linter-lint).

### Linter.lintWithLog

The `Linter.lintWithLog` method does almost exactly the same thing as [Linter.lint](./21_Linter-lint) except that it additionally returns the scoring details of the recommendation process for subsequent interpretation of the recommendation in any application.

```ts
lintWithLog(params: LintParams): LintsWithLog
```

See [Linter.lintWithLog](./22_Linter-lintWithLog).
