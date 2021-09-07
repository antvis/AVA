---
title: type
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

Analyze one field(data column).

Field Type is one of `string`, `float`, `integer`, `boolean`, `date`, `null`.

```sign
type(array)
```

### Arguments

* **array** * An array contains values in a data field(column).
  * _required_
  * `type`: any[]

### Returns

*FieldInfo*

```ts
interface FieldInfo {
  /** field type */
  type: TypeSpecifics | 'mixed'; // float integer bool date null string mixed
  /** recommendation type */
  recommendation: TypeSpecifics;
  /** number of empty inclues null undefined or empty string */
  missing: number;
  /** distinct count */
  distinct: number;
  /** Number of each distinct item */
  valueMap: Record<string, number>;
  /** count of samples */
  count: number;
  /** samples */
  samples: any[];
  /** more info */
  meta?: FieldMeta;
}
```

The structure of `FieldInfo` depends on its *recommendation* data type of the column. Different types lead to different `FieldMeta` for *meta*.

### Examples

#### Number Field

```ts
import { type } from '@antv/dw-analyzer';

const data = [1, 2, 3, 4, 5];

const fieldInfo = type(data);

console.log(fieldInfo);

// {
//   "count": 5, // rows
//   "distinct": 5,
//   "type": "integer",
//   "recommendation": "integer",
//   "missing": 0,
//   "samples": [ 1, 2, ... ],
//   "valueMap": { "1": 1, "2": 1, "3": 1, "4": 1, "5": 1 },
//   "minimum": 1,
//   "maximum": 5,
//   "mean": 3,
//   "percentile5": 1,
//   "percentile25": 2,
//   "percentile50": 3,
//   "percentile75": 4,
//   "percentile95": 5,
//   "sum": 15,
//   "stdev": 1.4142135623730951,
//   "variance": 2,
//   "zeros": 0
// }
```


#### Boolean Field

if just two distinct value in a field, it would be a `boolean` field

```ts
const data = ['Y', 'N', 'Y', 'N'];

const fieldInfo = type(data);

// {
//   "count": 4,
//   "distinct": 2,
//   "type": "boolean",
//   "recommendation": "boolean",
//   "missing": 0,
//   "samples": [ "Y", "N", "Y", "N" ],
//   "valueMap": {
//     "Y": 2,
//     "N": 2
//   }
// }
```

#### String Field

```ts
import { type, isUnique } from '@antv/dw-analyzer';

const data = ['A', 'B', '', 'D', 'EAT'];

const fieldInfo = type(data);

console.log(isUnique(fieldInfo));
// false because of the empty value

console.log(fieldInfo);

// {
//   "count": 5,
//   "distinct": 4,
//   "type": "string",
//   "recommendation": "string",
//   "missing": 1,
//   "samples": [ "A", "B", "", "D", "EAT" ],
//   "valueMap": {
//     "A": 1,
//     "B": 1,
//     "null": 1,
//     "D": 1,
//     "EAT": 1
//   },
//   "maxLength": 3,
//   "minLength": 1,
//   "meanLength": 1.5,
//   "containsChar": true,
//   "containsDigit": false,
//   "containsSpace": false,
// }
```

#### Date Field

Support ISO date format

```ts
const data = ['2019-01-01', '2018-01-01', '2017-01-01', '2016-01-01', '2015-01-01'];

const fieldInfo = type(data);

console.log(fieldInfo);
// {
//   "count": 5,
//   "distinct": 5,
//   "type": "date",
//   "recommendation": "date",
//   "missing": 0,
//   "samples": [ "2019-01-01", "2018-01-01", "2017-01-01", "2016-01-01", "2015-01-01" ],
//   "valueMap": {
//     "2019-01-01": 1,
//     "2018-01-01": 1,
//     "2017-01-01": 1,
//     "2016-01-01": 1,
//     "2015-01-01": 1
//   },
//   "minimum": 1420070400000, // timestampe
//   "maximum": 1546300800000
// }
```

</div>
