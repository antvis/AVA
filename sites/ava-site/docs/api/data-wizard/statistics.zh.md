---
title: statistics
order: 1
---

`markdown:docs/common/style.md`



DataWizard 的数学统计模块 `statistics`，支持最大值、最小值、方差、皮尔逊系数、变异系数等常用统计学方法。`DataFrame` 的统计信息计算能力，也是基于 `statitstics` 实现的。该方法会将计算过一次的值存储在缓存中，再次计算时可直接从缓存中取值，避免重复计算开销。

## min

计算数组最小值。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.min([1, 2, 3, 201, 999, 4, 5, 10]);
// 1
```

## minIndex

计算数组最小值索引。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.minIndex([1, 2, 3, 201, 999, 4, 5, 10]);
// 0
```

## max

计算数组最大值。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.max([1, 2, 3, 201, 999, 4, 5, 10]);
// 999
```

## maxIndex

计算数组最大值索引。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.maxIndex([1, 2, 3, 201, 999, 4, 5, 10]);
// 4
```

## sum

计算数组值之和。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.sum([1, 2, 3, 201, 999, 4, 5, 10]);
// 1225
```

## median

计算数组中位数。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

**sorted** 原数据是否已排序 _可选_

类型 `boolean`

默认值 `false`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.median([1, 2, 3, 201, 999, 4, 5, 10]);
// 4.5
```

## quartile

计算数组的四分位数。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

**sorted** 原数据是否已排序 _可选_

类型 `boolean`

默认值 `false`

***<font size=4>返回值</font>***

`number[]`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.quartile([1, 2, 3, 201, 999, 4, 5, 10]);
// [ 2.5, 4.5, 105.5 ]
```

## quantile

计算数组的指定分位数。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

**percent** 百分比 _必选_

类型 `number`

**sorted** 原数据是否已排序 _可选_

类型 `boolean`

默认值 `false`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.quantile([1, 2, 3, 201, 999, 4, 5, 10], 75);
// 10
```

## mean

计算数组的平均数。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.mean([1, 2, 3, 201, 999, 4, 5, 10]);
// 153.125
```

## geometricMean

计算数组的几何平均数。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.geometricMean([1, 2, 3, 201, 999, 4, 5, 10]);
// 11.162021352303842
```

## harmonicMean

计算数组的调和平均数。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.harmonicMean([1, 2, 3, 201, 999, 4, 5, 10]);
// 3.34824774196937
```

## variance

计算数组的方差。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.variance([1, 2, 3, 201, 999, 4, 5, 10]);
// 106372.359375
```

## standardDeviation

计算数组的标准差。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.standardDeviation([1, 2, 3, 201, 999, 4, 5, 10]);
// 326.1477569676051
```

## coefficientOfVariance

计算数组的变异系数。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.coefficientOfVariance([1, 2, 3, 201, 999, 4, 5, 10]);
// 2.1299445352986455
```

## covariance

计算两个数组的协方差。

***<font size=4>参数</font>***

**x** 原数据数组1 _必选_

类型 `number[]`

**y** 原数据数组2 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.covariance([1, 2, 3, 201, 999, 4, 5, 10], [12, 22, 23, 2201, 2999, 24, 25, 210]);
// 324526.3125
```

## pearson

计算两个数组的皮尔逊系数。

***<font size=4>参数</font>***

**x** 原数据数组1 _必选_

类型 `number[]`

**y** 原数据数组2 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.pearson([1, 2, 3, 201, 999, 4, 5, 10], [12, 22, 23, 2201, 2999, 24, 25, 210]);
// 0.8863724626851197
```

## valid

计算数组中的合法值个数，`undefined`、`null`、`NaN` 等可转换为 `false` 的值，均视为非法值。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `any[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.valid([1, 2, NaN, 201, undefined, 4, 5, null]);
// 5
```

## missing

计算数组中缺失值的个数，和 `valid` 方法互补。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `any[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.missing([1, 2, NaN, 201, undefined, 4, 5, null]);
// 3
```

## valueMap

统计数组中独立值的个数，以独立值本身为 key，个数为 value，生成对象。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `any[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.valueMap([1, 2, 3, 201, 999, 4, 5, 10]);
// { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '10': 1, '201': 1, '999': 1 }
```

## distinct

统计数组中独立值的个数。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `any[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

stats.distinct([1, 2, 3, 201, 999, 4, 5, 10]);
// 8
```

## minBy

计算数组指定字段的最小值。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `any[]`

**measure** 计算指定字段 _必选_

类型 `string`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

const objects = [{ 'n': 1 }, { 'n': 2 }];

stats.minBy(objects, 'n');
// 1
```

## maxBy

计算数组指定字段的最大值。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `any[]`

**measure** 计算指定字段 _必选_

类型 `string`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

const objects = [{ 'n': 1 }, { 'n': 2 }];

stats.maxBy(objects, 'n');
// 2
```

## sumBy

计算数组指定字段值之和。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `any[]`

**measure** 计算指定字段 _必选_

类型 `string`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

const objects = [{ 'n': 1 }, { 'n': 2 }];

stats.sumBy(objects, 'n');
// 3
```

## meanBy

计算数组指定字段平均数。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `any[]`

**measure** 计算指定字段 _必选_

类型 `string`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

const objects = [{ 'n': 1 }, { 'n': 2 }];

stats.meanBy(objects, 'n');
// 1.5
```

## countBy

计算数组指定字段总计数。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `any[]`

**measure** 计算指定字段 _必选_

类型 `string`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { statistics as stats } from '@antv/data-wizard';

const objects = [{ 'n': 1 }, { 'n': 2 }];

stats.countBy(objects, 'n');
// 2
```

## groupBy

将数组对象按字段分组。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `any[]`

**measure** 分组指定字段 _必选_

类型 `string`

***<font size=4>返回值</font>***

`any[]`

***<font size=4>用法</font>***

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

## aggregate

将数组对象按指定维度和字段聚合。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `any[]`

**dimension** 聚合指定维度 _必选_

类型 `string`

**measure** 聚合指定字段 _必选_

类型 `string`

**aggregateMethod** 聚合方法 _可选_

类型 `AggregateMethod`，默认为 `SUM`

```sign
type AggregateMethod = 'SUM' | 'COUNT' | 'MAX' | 'MIN' | 'MEAN';
```

**seriesField** 聚合指定序列 _可选_

类型 `string`

***<font size=4>返回值</font>***

`any[]`

***<font size=4>用法</font>***

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


