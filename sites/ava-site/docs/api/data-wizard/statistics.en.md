---
title: Statistics
order: 1
---

`markdown:docs/common/style.md`

<div class="doc-md">

`Statistics` contains the statistical method of DW employed to calculate some common statistical information. The method will store the values calculated once in the cache, and the values can be taken directly from the cache when calculated again to avoid duplicated calculation cost.

## min
Calculate the minimum value of the array.

### Parameters

**array** Original data array _required_

Type `number[]`

### Return value

`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.min([1, 2, 3, 201, 999, 4, 5, 10]);
// 1
```

## minBy
Calculates the minimum value of the specified field of the array.

### Parameters
**array** The original data array _required_

Type `[]`

**measure** Calculates the specified field _required_

Type `string`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

const objects = [{ 'n': 1 }, { 'n': 2 }];

stats.minBy(objects, 'n');
// 1
```

## minIndex
Compute the index of the minimum value of the array.

### Parameters
**array** The original data array _required_

Type `number[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.minIndex([1, 2, 3, 201, 999, 4, 5, 10]);
// 0
```

## max
Calculate the maximum value of the array.

### Parameters
**array** The original data array _required_

Type `number[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.max([1, 2, 3, 201, 999, 4, 5, 10]);
// 999
```

## maxBy
Calculates the maximum value of the specified field of the array.

### Parameters
**array** The original data array _required_

Type `[]`

**measure** Calculates the specified field _required_.

Type `string`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

const objects = [{ 'n': 1 }, { 'n': 2 }];

stats.maxBy(objects, 'n');
// 2
```

## maxIndex
Compute the index of the maximum value of the array.

### Parameters
**array** The original data array _required_

Type `number[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.maxIndex([1, 2, 3, 201, 999, 4, 5, 10]);
// 4
```

## sum
Compute the sum of the array values.

### Parameters
**array** The original data array _required_

Type `number[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.sum([1, 2, 3, 201, 999, 4, 5, 10]);
// 1225
```

## sumBy
Computes the sum of the values of the specified fields of the array.

### Parameters
**array** The original data array _required_

Type `[]`

**measure** Calculates the sum of the specified fields _required_.

Type `string`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

const objects = [{ 'n': 1 }, { 'n': 2 }];

stats.sumBy(objects, 'n');
// 3
```

## median
Compute the median of the array.

### Parameters
**array** The original data array _required_

type `number[]`

**sorted** Whether the original data is sorted or not _optional_

Type `boolean`

Default value `false`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.median([1, 2, 3, 201, 999, 4, 5, 10]);
// 4.5
```

## quartile
Compute the quartile of the array.

### Parameters
**array** The original data array _required_

type `number[]`

**sorted** Whether the original data is sorted _optional_

Type `boolean`

Default value `false`

### Return value
`number[]`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.quartile([1, 2, 3, 201, 999, 4, 5, 10]);
// [ 2.5, 4.5, 105.5 ]
```

## quantile
Compute the specified quantile of the array.

### Parameters
**array** The original data array _required_

type `number[]`

**percent** percent _required_

Type `number`

**sorted** whether the original data is sorted _optional

Type `boolean`

Default value `false`

### Return value
`number`

### 用法
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.quantile([1, 2, 3, 201, 999, 4, 5, 10], 75);
// 10
```

## quantile
Compute the specified quantile of the array.

### Parameters
**array** The original data array _required_

type `number[]`

**percent** percent _required_

Type `number`

**sorted** whether the original data is sorted _optional

Type `boolean`

Default value `false`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.quantile([1, 2, 3, 201, 999, 4, 5, 10], 75);
// 10
```

## mean
Compute the mean of the array.

### Parameters
**array** The original data array _required_

type `number[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.mean([1, 2, 3, 201, 999, 4, 5, 10]);
// 153.125
```

## meanBy
Calculate the average number of the specified fields in the array.

### Parameters
**array** The original data array _required_

type `[]`

**measure** Calculates the specified field _required_

Type `string`

### Return value
`number`

### 用法
```ts
import { statistics as stats } from '@antv/data-wizard';

const objects = [{ 'n': 1 }, { 'n': 2 }];

stats.meanBy(objects, 'n');
// 1.5
```

## geometricMean
Computes the geometric mean of the array.

### Parameters
**array** The original data array _required_

Type `number[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.geometricMean([1, 2, 3, 201, 999, 4, 5, 10]);
// 11.162021352303842
```

## harmonicMean
Computes the harmonic mean of an array.

### Parameters
**array** The original data array _required_

Type `number[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.harmonicMean([1, 2, 3, 201, 999, 4, 5, 10]);
// 3.34824774196937
```

## variance
Compute the variance of the array.

### Parameters
**array** The original data array _required_

Type `number[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.variance([1, 2, 3, 201, 999, 4, 5, 10]);
// 106372.359375
```

## standardDeviation
Calculate the standard deviation of the array.

### Parameters
**array** The original data array _required_

Type `number[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.standardDeviation([1, 2, 3, 201, 999, 4, 5, 10]);
// 326.1477569676051
```

## coefficientOfVariance
Compute the coefficient of variance of the array.

### Parameters
**array** The original data array _required_

Type `number[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.coefficientOfVariance([1, 2, 3, 201, 999, 4, 5, 10]);
// 2.1299445352986455
```

## covariance
Compute the covariance of two arrays.

### Parameters
**x** original data array1 _required_

Type `number[]`

**y** Original data array 2 _required_

Type `number[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.covariance([1, 2, 3, 201, 999, 4, 5, 10], [12, 22, 23, 2201, 2999, 24, 25, 210]);
// 324526.3125
```

## pearson
Compute the Pearson coefficients of two arrays.

### Parameters
**x** original data array1 _required_

Type `number[]`

**y** Original data array 2 _required_

Type `number[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.pearson([1, 2, 3, 201, 999, 4, 5, 10], [12, 22, 23, 2201, 2999, 24, 25, 210]);
// 0.8863724626851197
```

## valid
Count the number of legal values in the array, `undefined`, `null`, `NaN` and other values which can be converted to `false` are regarded as illegal values.

### Parameters
**array** The original data array _required_

Type `any[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.valid([1, 2, NaN, 201, undefined, 4, 5, null]);
// 5
```

## missing
Count the number of missing values in the array, complementary to the `valid` method.

### Parameters
**array** The original data array _required_

Type `any[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.missing([1, 2, NaN, 201, undefined, 4, 5, null]);
// 3
```

## valueMap
Count the number of independent values in the array, and generate an object with the independent value itself as key and the number as value.

### Parameters
**array** The original data array _required_

type `any[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.valueMap([1, 2, 3, 201, 999, 4, 5, 10]);
// { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '10': 1, '201': 1, '999': 1 }
```

## distinct
Count the number of distinct values in the array.

### Parameters
**array** The original data array _required_

type `any[]`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

stats.distinct([1, 2, 3, 201, 999, 4, 5, 10]);
// 8
```

## countBy
Calculate the total count of the specified field of the array.

### Parameters
**array** The original data array _required_

Type `[]`

**measure** Calculates the specified field _required_.

Type `string`

### Return value
`number`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

const objects = [{ 'n': 1 }, { 'n': 2 }];

stats.countBy(objects, 'n');
// 2
```

## groupBy
Group the array objects by field.

### Parameters
**array** The original data array _required_

type `[]`

**measure** Grouping of specified fields _required_

type `string`

### Return value
`[]`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';


const objects = [
  {
   'dimension': 'color',
   'measure': 'height'
  }, {
   'dimension': 'map',
   'measure': 'height'
  }, {
   'dimension': 'data',
   'measure': 'weight'
  }
];

stats.groupBy(objects, 'measure');
// {
//   'height': [
//     {
//       'dimension': 'color',
//       'measure': 'height'
//     }, {
//       'dimension': 'map',
//       'measure': 'height'
//     }
//   ], 
//   'weight': [
//     {
//       'dimension': 'data',
//       'measure': 'weight'
//     }
//   ]
// }
```

## flatten
Flatten the array object.

### Parameters
**array** The original data array _required_

Type `[]`

### Return value
`[]`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

const array = [1, [2, 3], 4];

stats.flatten(array);
// [1, 2, 3, 4]
```

## aggregate
Aggregate the array objects by the specified dimensions and fields.

### Parameters
**array** The original data array _required_

type `[]`

**dimension** Aggregates the specified dimension _required_

Type `string`

**measure** Aggregates the specified fields _required_

Type `string`

**aggregateMethod** Aggregate method _optional_

Type ``AggregateMethod`, defaults to ``SUM`

```sign
type AggregateMethod = 'SUM' | 'COUNT' | 'MAX' | 'MIN' | 'MEAN';
```

**seriesField** Aggregate the specified sequence _optional_

Type `string`

### Return value
`[]`

### Usage

Type `string`

### Return value
`[]`

### Usage
```ts
import { statistics as stats } from '@antv/data-wizard';

const objects = [
  {
    'dim': 1,
    'n': 1
  }, {
    'dim': 2,
    'n': 2,
    'm': 2
  }, {
    'dim': 1,
    'n': 3,
    'k': 3
  }
];

const dimensionName = 'dim';

const measureName = 'n';

stats.aggregate(objects, dimensionName, measureName);
// [
//   {
//     'dim': 1,
//     'n': 1
//   },
//   {
//     'dim': 2,
//     'n': 5
//   }
// ]
```

</div>
