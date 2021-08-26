---
title: dataPropsToAdvices
order: 2
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
dataPropsToAdvices(dataProps: BasicDataPropertyForAdvice[], options?: AdvisorOptions | undefined)
```

### Arguments

* **dataProps** * Data properties of columns of dataset.
  * _required_
  * `type`: BasicDataPropertyForAdvice[]

The `BasicDataPropertyForAdvice` is the minimum subset of `DataProperty` which can make pipeline easily starts with this step.
```typescript
export interface BasicDataPropertyForAdvice {
  /** field name */
  readonly name: string;
  /** LOM */
  readonly levelOfMeasurements: LOM[];
  /** used for split column xy series */
  readonly samples: any[];
  /** required types in analyzer FieldInfo */
  readonly recommendation: FieldInfo['recommendation'];
  readonly type: FieldInfo['type'];
  readonly distinct?: number;
  readonly count?: number;
  readonly sum?: number;
  readonly maximum?: any;
  readonly minimum?: any;
  readonly missing?: number;
}
```

* **options** * Options for chart recommendation.
  * _optional_
  * `type`: AdvisorOptions ｜ undefined

`markdown:docs/common/advisor-options.en.md`

### Returns

*`Advice[]`*

```ts
interface Advice {
  type: ChartID;
  spec: Specification | null;
  score: number;
}
```

* type `ChartID` Recommended chart type in CKB ChartID
* score `number` Recommend score.
* spec `VegaLiteSpec` Vega-Lite specification

</div>
