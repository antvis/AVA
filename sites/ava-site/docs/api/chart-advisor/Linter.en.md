---
title: Linter
order: 5
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
Class Linter(ruleCfg?: RuleConfig)
```

### Parameters

* **ruleCfg** * Chart rule Config
  * _optional_
  * `Parameter type`: RuleConfig object

* ***RuleConfig*** Parameter configuration.

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

#### Linter.lint

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


</div>
