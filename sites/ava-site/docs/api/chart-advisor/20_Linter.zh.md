---
title: Linter
order: 20
---

`markdown:docs/common/style.md`



```sign
Class Linter(ruleCfg?: RuleConfig)
```

* **Linter**: 是对应图表优化的工具类。

`Linter` 提供了 `lint()` 函数用于提供图表优化建议。

## 参数

* **ruleCfg** * 规则配置
  * _可选参数_
  * `参数类型`: RuleConfig 对象

* _**RuleConfig**_ 图表规则参数配置。

| 属性    | 类型                         | 描述                                 | 默认值     |
| ------- | ---------------------------- | ------------------------------------ | ---------- |
| exclude | `string[]`                   | 指定不包含的 `ruler` 规则。          | 无  `可选` |
| include | `string[]`                   | 指定包含的规则，优先级低于 exclude。 | 无  `可选` |
| custom  | `Record<string, RuleModule>` | 自定义规则。                         | 无  `可选` |
| options | `ChartRuleConfigMap`         | 规则配置。                           | 无  `可选` |

* _**RuleModule**_ `ruler` 自定义规则，详见 [Ruler](./30_Ruler)。

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

* _**ChartRuleConfigMap**_ `ruler` 规则配置，详见 [Ruler](./30_Ruler)。

```ts
type ChartRuleConfigMap = Record<string, ChartRuleConfig>;

interface ChartRuleConfig {
  weight?: number;
  off?: boolean;
  extra?: Record<string, any>;
}
```

## 方法

### Linter.lint

获得图表优化建议结果的 `Lint[]`。

```ts
Linter.lint(params: LintParams): Lint[];
```

详见 [Linter.lint](./21_Linter-lint)。

### Linter.lintWithLog

作用和 [Linter.lint](./21_Linter-lint) 几乎完全相同。只不过会额外地将查错过程中的打分细节一并返回，方便在应用中进行后续的解释。

```ts
lintWithLog(params: LintParams): LintsWithLog
```

详见 [Linter.lintWithLog](./22_Linter-lintWithLog)。
