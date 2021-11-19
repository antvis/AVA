---
title: Linter
order: 5
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

* ***RuleConfig*** Parameter configuration.

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

### Linter.lint

Get the `Lint[]` of chart optimization suggestions as detailed in [Linter.lint](./lint).

```ts
Linter.lint(params: LintParams): Lint[];
```

Parameter:

```ts
interface LintParams {
  spec: AntVSpec;
  dataProps?: BasicDataPropertyForAdvice[];
  options?: LinterOptions;
}
```

Return value:

```ts
interface Lint {
  type: string;
  id: string;
  score: number;
  fix?: any;
  docs?: any;
}
```



