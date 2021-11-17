---
title: Linter
order: 5
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
Class Linter(ruleCfg?: RuleConfig)
```

### 参数

* **ruleCfg** * 规则配置
  * _可选参数_
  * `参数类型`: RuleConfig 对象

* ***RuleConfig*** 图表规则参数配置。

```ts
type RuleConfig = {
  include?: string[];
  exclude?: string[];
  custom?: Record<string, RuleModule>;
  options?: ChartRuleConfigMap;
};
```

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| exclude | `string[]` | 指定不包含的 `ruler` 规则。 | 无 |
| include | `string[]]` | 指定包含的规则，优先级低于 exclude。 | 无 |
| custom | `Record<string, RuleModule>` | 自定义规则。 | 无 |
| options | `ChartRuleConfigMap` | 规则配置。 | 无 |

* ***RuleModule*** `ruler` 自定义规则，详见 [Ruler](../ckb/Ruler)。

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

* ***ChartRuleConfigMap*** `ruler` 规则配置

```ts
type ChartRuleConfigMap = Record<string, ChartRuleConfig>;

interface ChartRuleConfig {
  weight?: number;
  off?: boolean;
}
```

### 方法

#### Linter.lint

获得图表优化建议结果的 `Lint[]`，详见 [Linter.lint](./lint).

```ts
Linter.lint(params: LintParams): Lint[];
```

参数：

```ts
interface LintParams {
  spec: AntVSpec;
  dataProps?: BasicDataPropertyForAdvice[];
  options?: LinterOptions;
}
```

返回值：

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
