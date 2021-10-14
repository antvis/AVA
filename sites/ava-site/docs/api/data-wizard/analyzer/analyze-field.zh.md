---
title: type
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

对单字段数据进行分析。

字段类型只有 `string`、 `float`、 `integer`、 `boolean`、 `date`、 `null` 几种。

```sign
type(array)
```

### 参数

* **array** * 一个包含字段所有的值的数组。
  * _必要参数_
  * `参数类型`: any[]

### 返回值

*FieldInfo*

```ts
interface FieldInfo {
  /** 字段类型 */
  type: TypeSpecifics | 'mixed'; // float integer bool date null string mixed
  /** 推荐使用的字段类型 */
  recommendation: TypeSpecifics;
  /** 空值数 */
  missing: number;
  /** 多少种值 */
  distinct: number;
  /** 值与其数量的映射 */
  valueMap: Record<string, number>;
  /** 行数 */
  count: number;
  /** 数据存样 */
  samples: any[];
  /** 额外信息 */
  meta?: FieldMeta;
}
```

根据推荐使用的字段类型 *recommendation* 的不同， `FieldInfo` 的结构也会不同，因为其额外信息 *meta* 的结构 `FieldMeta` 不同。详见下面的例子。

### 示例

#### Number 数值字段

```ts
import { analyzer } from '@antv/data-wizard';

const data = [1, 2, 3, 4, 5];

const fieldInfo = analyzer.analyzeField(data);

console.log(fieldInfo);

// {
//   "count": 5, // 行数
//   "distinct": 5, //
//   "type": "integer",
//   "recommendation": "integer", // 推荐类型
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
//   "stdev": 1.4142135623730951, //标准差
//   "variance": 2, // 方差
//   "zeros": 0
// }
```

#### Boolean 布尔值字段

如果只有字段里面只有两种值，则认为这个字段为 Boolean 而不管值的实际类型

```ts
const data = ['Y', 'N', 'Y', 'N'];

const fieldInfo = type(data);

console.log(fieldInfo);

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

#### String 字符串字段

```ts
import { analyzer } from '@antv/data-wizard';

const data = ['A', 'B', '', 'D', 'EAT'];

const fieldInfo = analyzer.analyzeField(data);

console.log(analyzer.isUnique(fieldInfo));
// false 有空值

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

#### Date 日期时间字段

支持 ISO 日期格式

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
