---
title: typeAll
order: 1
---

`markdown:docs/common/style.md`

<div class="doc-md">

Analyzer Multiple Fields.

```sign
typeAll(array, fields)
```

### Arguments

* **array** * Row data array.
  * _required_
  * `type`: Record<string, any>[]

* **fields** * Names of fields which you need to analyze.
  * _optional_
  * `type`: string[]

### Returns

*FieldsInfo* = `Array<FieldInfo & { name: string }>`

### Examples

```ts
import { analyzer, DataFrame } from '@antv/data-wizard';

const data = [
  { x: 1, y: 1, z: 1 },
  { x: 2, y: 4, z: 4 },
  { x: 3, y: 6, z: 9 },
  { x: 4, y: 8, z: 16 },
  { x: 5, y: 10, z: 25 },
];

const df = new DataFrame(data);
const fieldInfo = df.info();

console.log(analyzer.isUnique(info.fields.x));
// true

console.log(fieldInfo);

// {
//   "fields": [
//     {
//       "count": 5,
//       "distinct": 5,
//       "type": "integer",
//       "recommendation": "integer",
//       "missing": 0,
//       "samples": [ 1, 2, ... ],
//       "valueMap": { "1": 1, "2": 1, "3": 1, "4": 1, "5": 1 },
//       "minimum": 1,
//       "maximum": 5,
//       "mean": 3,
//       "percentile5": 1,
//       "percentile25": 2,
//       "percentile50": 3,
//       "percentile75": 4,
//       "percentile95": 5,
//       "sum": 15,
//       "standardDeviation": 1.4142135623730951,
//       "variance": 2,
//       "zeros": 0,
//       "name": "x"
//     },
//     ....
//   ],
//   "pearson": [ // Pearson correlation coefficient
//     [ "x", "y", 0.9958932064677043 ],
//     [ "x", "z", 0.9811049102515929 ],
//     [ "y", "z", 0.9622715374524 ]
//   ]
// }
```


</div>
