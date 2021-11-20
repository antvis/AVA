---
title: DataFrame
order: 0
---

`markdown:docs/common/style.md`



DW 中的二维数据结构，支持读取不同类型的一维和二维源数据，将其转换为 `DataFrame` 数据基本流转单元来处理数据。使用 `DataFrame`，你可以从一个数据集样本中获取和切割数据，也可以提取出各个字段的信息。这些信息包括字段的特征（字段名称、数据类型、统计信息等），性质（连续性、离散性等），以及多字段间的字段间关系（相关性、周期性等）。

## new DataFrame

***<font size=4>参数</font>***


**data** 源数据 _必选_

可接受常见的一维数据和二维数据。

类型

* 一维数据
  * 基础数据结构 `number | string | boolean | undefined | null`
  * 一维数组 `any[]`
  * 一维对象 `{ [key: string]: any }`
* 二维数据
  * 二维数组 `any[][]`
  * 对象数组 `{ [key: string]: any }[]`
  * 数组对象 `{ [key: string]: any[] }`

**extra** 额外参数 _可选_

用于配置行索引、列索引和缺失填充值。
  
| 属性 | 类型 | 描述 | 默认值 | 必选 | 
| ----| ---- | ---- | ---- | ---- |
| indexes | `string | number` | 行索引 | - | - |
| columns | `string | number` | 列索引 | - | - |
| fillValue |  `any` | 缺失填充值 | - | - |

***<font size=4>返回值</font>***


`DataFrame`

***<font size=4>用法</font>***


```ts
import { DataFrame } from '@antv/data-wizard';

/* Basic usage */
const data = [
  { a: 1, b: 4, c: 7 },
  { a: 2, b: 5, c: 8 },
  { a: 3, b: 6, c: 9 },
];

new DataFrame(data);
/*
DataFrame
  {
    axes: [
      [0, 1, 2],
      ['a', 'b', 'c'],
    ],
    data: [
      [1, 4, 7],
      [2, 5, 8],
      [3, 6, 9],
    ],
    colData: [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ],
  }
*/

/* Set extra indexes and columns */
new DataFrame(data, {
  indexes: ['i1', 'i2', 'i3'],
  columns: ['c', 'b'],
});
/*
DataFrame
  {
    axes: [
      ['i1', 'i2', 'i3'],
      ['c', 'b'],
    ],
    data: [
      [7, 4],
      [8, 5],
      [9, 6],
    ],
    colData: [
      [7, 8, 9],
      [4, 5, 6],
    ],
  }
*/

/* Set extra fillValues */
const data3 = [
  { a: 1, b: 4 },
  { a: 2, c: 8 },
  { b: 6, c: 9 },
];

new DataFrame(data3, {
  fillValue: 201
});
/*
DataFrame
  {
    axes: [
      [0, 1, 2],
      ['a', 'b', 'c'],
    ],
    data: [
      [1, 4, 201],
      [2, 201, 8],
      [201, 6, 9],
    ],
    colData: [
      [1, 2, 201],
      [4, 201, 6],
      [201, 8, 9],
    ],
  }
*/
```

## shape

获取 DataFrame 数据维度。

***<font size=4>用法</font>***


```ts
import { DataFrame } from '@antv/data-wizard';

const df = new DataFrame([
  { a: 1, b: 4, c: 7 },
  { a: 2, b: 5, c: 8 },
  { a: 3, b: 6, c: 9 },
]);

df.shape;
// [ 3, 3 ]
```

## get

通过 indexes 和 columns 值获取和切割数据。

***<font size=4>参数</font>***


**rowLoc** 行位置 _必选_

使用 indexes 值来描述的行位置。

类型 `(string | number) | (string | number)[] | string`

**colLoc** 列位置 _可选_

使用 columns 值来描述的列位置。

类型 `(string | number) | (string | number)[] | string`

***<font size=4>返回值</font>***


`DataFrame | Series | any`

***<font size=4>用法</font>***


```ts
import { DataFrame } from '@antv/data-wizard';

/* 使用 indexes值 获取数据 */
const df = new DataFrame([
  { a: 1, b: 4, c: 7 },
  { a: 2, b: 5, c: 8 },
  { a: 3, b: 6, c: 9 },
]);

df.get(0);
/*
Series
  { 
    axes: [['a', 'b', 'c']], 
    data: [1, 4, 7]
  }
*/

/* 使用 indexes值 数组获取数据 */
df.get([0, 2]);
/*
DataFrame
  {
    axes: [
      [0, 2],
      ['a', 'b', 'c'],
    ],
    data: [
      [1, 4, 7],
      [3, 6, 9],
    ],
    colData: [
      [1, 3],
      [4, 6],
      [7, 9],
    ],
  }
*/

/* 使用 indexes slice值 获取数据 */
df.get('0:2');
/*
DataFrame
 {
    axes: [
      [0, 1],
      ['a', 'b', 'c'],
    ],
    data: [
      [1, 4, 7],
      [2, 5, 8],
    ],
    colData: [
      [1, 2],
      [4, 5],
      [7, 8],
    ],
  }
*/

/* 使用 indexes + columns值 获取数据 */
const df = new DataFrame([
  { a: 1, b: 4, c: 7 },
  { a: 2, b: 5, c: 8 },
  { a: 3, b: 6, c: 9 },
]);

df.get(1, 'c');
/*
DataFrame
  {
    axes: [[1], ['c']],
    data: [[8]],
    colData: [[8]],
  }
*/

/* 使用 indexes + columns值数组 获取数据 */
const df = new DataFrame([
  { a: 1, b: 4, c: 7 },
  { a: 2, b: 5, c: 8 },
  { a: 3, b: 6, c: 9 },
]);

df.get(1, ['a', 'c']);
/*
DataFrame
  {
    axes: [[1], ['a', 'c']],
    data: [[2, 8]],
    colData: [[2], [8]],
  }
*/

/* 使用 indexes + columns slice值 获取数据 */
const df = new DataFrame([
  { a: 1, b: 4, c: 7 },
  { a: 2, b: 5, c: 8 },
  { a: 3, b: 6, c: 9 },
]);

df.get(1, 'a:c');
/*
DataFrame
  {
    axes: [[1], ['a', 'b']],
    data: [[2, 5]],
    colData: [[2], [5]],
  }
*/
```

## getByIndex

通过行列数值索引获取和切割数据。和 `get` 方法用法类似，但是只能使用整数索引，例如，`getByIndex(0, 0)` 是取第一行第一列的数据。

***<font size=4>参数</font>***


**rowLoc** 行位置 _必选_

使用行数值索引来描述的行位置。

类型 `number | number[] | string`

**colLoc** 列位置 _可选_

使用列数值索引来描述的列位置。

类型 `number | number[] | string`

***<font size=4>返回值</font>***


`DataFrame | Series | any`

***<font size=4>用法</font>***


```ts
import { DataFrame } from '@antv/data-wizard';

/* 行列索引获取数据 */
const df = new DataFrame([
  { a: 1, b: 4, c: 7 },
  { a: 2, b: 5, c: 8 },
  { a: 3, b: 6, c: 9 },
]);

df.getByIndex(0, 1);
/*
DataFrame
  {
    axes: [[0], ['b']],
    data: [[4]],
    colData: [[4]],
  }
*/
```

## getByColumn

通过 Columns 值获取数据。

***<font size=4>参数</font>***


**col** columns值 _必选_

使用 Columns值 来描述的列位置。

类型 `string | number`

***<font size=4>返回值</font>***


`Series`

***<font size=4>用法</font>***


```ts
import { DataFrame } from '@antv/data-wizard';

const df = new DataFrame([
  { a: 1, b: 4, c: 7 },
  { a: 2, b: 5, c: 8 },
  { a: 3, b: 6, c: 9 },
]);

df.getByColumn('a');
/*
Series
 { 
   axes: [[0, 1, 2]], 
   data: [1, 2, 3] 
  }
*/
```

## info

获取常用的统计学信息。

***<font size=4>返回值</font>***


`FieldsInfo`

***<font size=4>用法</font>***


```ts
import { DataFrame } from '@antv/data-wizard';

const df = new DataFrame([
  { a: 1, b: 4, c: 7 },
  { a: 2, b: 5, c: 8 },
  { a: 3, b: 6, c: 9 },
]);

df.info();
/*
  [
    {
      count: 3,
      distinct: 3,
      type: 'integer',
      recommendation: 'integer',
      missing: 0,
      rawData: [1, 2, 3],
      valueMap: { '1': 1, '2': 1, '3': 1 },
      minimum: 1,
      maximum: 3,
      mean: 2,
      percentile5: 1,
      percentile25: 1,
      percentile50: 2,
      percentile75: 3,
      percentile95: 3,
      sum: 6,
      variance: 0.6666666666666666,
      standardDeviation: 0.816496580927726,
      zeros: 0,
      levelOfMeasurements: ['Interval', 'Discrete'],
      name: 'a',
    },
    {
      count: 3,
      distinct: 3,
      type: 'integer',
      recommendation: 'integer',
      missing: 0,
      rawData: [4, 5, 6],
      valueMap: { '4': 1, '5': 1, '6': 1 },
      minimum: 4,
      maximum: 6,
      mean: 5,
      percentile5: 4,
      percentile25: 4,
      percentile50: 5,
      percentile75: 6,
      percentile95: 6,
      sum: 15,
      variance: 0.6666666666666666,
      standardDeviation: 0.816496580927726,
      zeros: 0,
      levelOfMeasurements: ['Interval', 'Discrete'],
      name: 'b',
    },
    {
      count: 3,
      distinct: 3,
      type: 'integer',
      recommendation: 'integer',
      missing: 0,
      rawData: [7, 8, 9],
      valueMap: { '7': 1, '8': 1, '9': 1 },
      minimum: 7,
      maximum: 9,
      mean: 8,
      percentile5: 7,
      percentile25: 7,
      percentile50: 8,
      percentile75: 9,
      percentile95: 9,
      sum: 24,
      variance: 0.6666666666666666,
      standardDeviation: 0.816496580927726,
      zeros: 0,
      levelOfMeasurements: ['Interval', 'Discrete'],
      name: 'c',
    },
  ]
*/
```

