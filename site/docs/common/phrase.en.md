***IPhrase*** Description of phrase

Phrase descriptions are distinguished by type, which is divided into text phrases and entity phrases, and entity phrases are used to mark lexical attributes.
The current descriptions in the lite-insight module involve entity types such as

* `'metric_name'`: Metric Name;
* `'metric_value'`: Metric Value;
* `'trend_desc'`: Trend Description;
* `'dim_value'`: Dimension Value;

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
