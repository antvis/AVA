***IPhrase*** 短语描述

短语描述用 type 区分，分为文本短语和实体短语，实体短语用于标记词汇属性。目前在 lite-insight 模块描述涉及实体类型有：

* `'metric_name'`: 指标名；
* `'metric_value'`: 指标值；
* `'trend_desc'`: 趋势描述；
* `'dim_value'`: 维度值；

```ts
export type IPhrase = ITextPhrase | IEntityPhrase;

export interface ITextPhrase {
  type: 'text';
  value: string;
}

export interface IEntityPhrase {
  type: 'entity';
  value?: string;
  metadata?: {
    entityType: 'metric_name' | 'metric_value' | 'trend_desc' | 'dim_value';
  };
}
```
