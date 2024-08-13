---
title: statistics
order: 1
---

<embed src='@/docs/common/style.md'></embed>


The `statistics` module of data provides common statistical methods, including computing minimum, maximum, variance, Pearson correlation coefficient, etc. The statistical information extracting of `DataFrame` is also based on `statistics`. The method will store the values calculated once in the cache, and the values can be taken directly from the cache when calculated again to avoid duplicated calculation cost.

## min

Calculate the minimum value of the array.

***<font size=4>Parameters</font>***


**array** Raw array data _required_

Type `number[]`

***<font size=4>Return value</font>***


`number`

***<font size=4>Usage</font>***

```ts
import { min } from '@antv/ava';

min([1, 2, 3, 201, 999, 4, 5, 10]);
// 1
```

## max

Calculate the maximum value of the array.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

Type `number[]`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { max } from '@antv/ava';

max([1, 2, 3, 201, 999, 4, 5, 10]);
// 999
```

## maxabs

Calculate the maximum absolute value of array.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

Type `number[]`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { maxabs } from '@antv/ava';

maxabs([1, 2, 3, -201, -999, 4, 5, 10]);
// 999
```

## sum

Calculate the sum of the array values.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

Type `number[]`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { sum } from '@antv/ava';

sum([1, 2, 3, 201, 999, 4, 5, 10]);
// 1225
```

## median

Calculate the median of the array.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

type `number[]`

**sorted** Whether the raw data is sorted _optional_

Type `boolean`

Default `false`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { median } from '@antv/ava';

median([1, 2, 3, 201, 999, 4, 5, 10]);
// 4.5
```

## quartile

Calculate the quartile of the array.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

type `number[]`

**sorted** Whether the raw data is sorted _optional_

Type `boolean`

Default `false`

***<font size=4>Return value</font>***

`number[]`

***<font size=4>Usage</font>***

```ts
import { quartile } from '@antv/ava';

quartile([1, 2, 3, 201, 999, 4, 5, 10]);
// [ 2.5, 4.5, 105.5 ]
```

## quantile

Calculate the specified quantile of the array.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

type `number[]`

**percent** Percent _required_

Type `number`

**sorted** Whether the raw data is sorted _optional_

Type `boolean`

Default `false`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { quantile } from '@antv/ava';

quantile([1, 2, 3, 201, 999, 4, 5, 10], 75);
// 10
```

## mean

Calculate the mean of the array.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

type `number[]`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { mean } from '@antv/ava';

mean([1, 2, 3, 201, 999, 4, 5, 10]);
// 153.125
```

## geometricMean

Calculate the geometric mean of the array.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

Type `number[]`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { geometricMean } from '@antv/ava';

geometricMean([1, 2, 3, 201, 999, 4, 5, 10]);
// 11.162021352303842
```

## harmonicMean

Calculate the harmonic mean of the array.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

Type `number[]`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { harmonicMean } from '@antv/ava';

harmonicMean([1, 2, 3, 201, 999, 4, 5, 10]);
// 3.34824774196937
```

## variance

Calculate the variance of the array.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

Type `number[]`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { variance } from '@antv/ava';

variance([1, 2, 3, 201, 999, 4, 5, 10]);
// 106372.359375
```

## standardDeviation

Calculate the standard deviation of the array.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

Type `number[]`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { standardDeviation } from '@antv/ava';

standardDeviation([1, 2, 3, 201, 999, 4, 5, 10]);
// 326.1477569676051
```

## coefficientOfVariance

Calculate the coefficient of variance of the array.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

Type `number[]`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { coefficientOfVariance } from '@antv/ava';

coefficientOfVariance([1, 2, 3, 201, 999, 4, 5, 10]);
// 2.1299445352986455
```

## covariance

Calculate the covariance of two arrays.

***<font size=4>Parameters</font>***

**x** First raw array data _required_

Type `number[]`

**y** Second raw array data _required_

Type `number[]`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { covariance } from '@antv/ava';

covariance([1, 2, 3, 201, 999, 4, 5, 10], [12, 22, 23, 2201, 2999, 24, 25, 210]);
// 324526.3125
```

## pearson

Calculate the Pearson correlation coefficient of two arrays.

***<font size=4>Parameters</font>***

**x** First raw array data _required_

Type `number[]`

**y** Second raw array data _required_

Type `number[]`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { pearson } from '@antv/ava';

pearson([1, 2, 3, 201, 999, 4, 5, 10], [12, 22, 23, 2201, 2999, 24, 25, 210]);
// 0.8863724626851197
```

## valid

Count the number of valid values in the array, `undefined`, `null`, `NaN` and other values which can be converted to `false` are regarded as invalid values.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

Type `any[]`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { valid } from '@antv/ava';

valid([1, 2, NaN, 201, undefined, 4, 5, null]);
// 5
```

## missing

Count the number of missing values in the array.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

Type `any[]`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { missing } from '@antv/ava';

missing([1, 2, NaN, 201, undefined, 4, 5, null]);
// 3
```

## valueMap

Count the number of independent values in the array, and generate an object with the independent value itself as key and the number as value.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

type `any[]`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { valueMap } from '@antv/ava';

valueMap([1, 2, 3, 201, 999, 4, 5, 10]);
// { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '10': 1, '201': 1, '999': 1 }
```

## distinct

Count the number of distinct values in the array.

***<font size=4>Parameters</font>***

**array** Raw array data _required_

type `any[]`

***<font size=4>Return value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { distinct } from '@antv/ava';

distinct([1, 2, 3, 201, 999, 4, 5, 10]);
// 8
```
