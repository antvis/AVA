# QuickStart - Analyzer

## Install

```shell
npm install @antv/dw-analyzer -S
```

or

```shell
yarn add @antv/dw-analyzer -S
```

## Usage

### Analyzer one Field

Field Type is one of `string`, `float`, `integer`, `boolean`, `date`, `null`.

```typescript
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

### Analyzer Multiple Fields

```typescript
import { typeAll, isUnique } from '@antv/dw-analyzer';
const data = [
  { x: 1, y: 1, z: 1 },
  { x: 2, y: 4, z: 4 },
  { x: 3, y: 6, z: 9 },
  { x: 4, y: 8, z: 16 },
  { x: 5, y: 10, z: 25 },
];

const fieldInfo = typeAll(data);

console.log(isUnique(info.fields.x));
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
//       "stdev": 1.4142135623730951,
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

### Boolean

if just two distinct value in a field, it would be a `boolean` field

```typescript
import { type } from '@antv/dw-analyzer';
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

### String

```typescript
import { type, isUnique } from '@antv/dw-analyzer';
const data = ['A', 'B', '', 'D', 'EAT'];

const fieldInfo = type(data);

console.log(isUnique(fieldInfo));
// false beacuase of the empty value

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
//   "containsChars": true,
//   "containsDigits": false,
//   "containsSpace": false,
//   "containsNonWorlds": false
// }
```

### Date

Support ISO date format

```typescript
import { type } from '@antv/dw-analyzer';
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
