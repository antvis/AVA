---
title: dataPropsToAdvices
order: 2
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
dataPropsToAdvices(dataProps: DataProperty[], options?: AdvisorOptions | undefined)
```

### Arguments

* **dataProps** * Data properties of columns of dataset.
  * _required_
  * `type`: DataProperty[]

* **options** * Options for chart recommendation.
  * _optional_
  * `type`: AdvisorOptions ｜ undefined

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
