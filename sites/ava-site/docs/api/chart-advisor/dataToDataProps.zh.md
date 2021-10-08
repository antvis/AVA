---
title: dataToDataProps
order: 1
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
dataToDataProps(data: any[]): DataProperty[]
```

### 参数

* **data** * 数据
  * _必要参数_
  * `参数类型`: key-value 对象数组
* **fields** * 选择部分字段
  * _可选参数_
  * `type`: string[]
### 返回值

*`DataProperty[]`* 

```sign
type DataProperty =
  | (DWAnalyzer.NumberFieldInfo & { name: string; levelOfMeasurements: LOM[] })
  | (DWAnalyzer.DateFieldInfo & { name: string; levelOfMeasurements: LOM[] })
  | (DWAnalyzer.StringFieldInfo & { name: string; levelOfMeasurements: LOM[] });
```

入参数组中每一项中 key 对应的数据属性分析结果构成的数组，结果数组长度与入参数组项中 key 个数相等，可能得到的数据类型有三种 Number、Date 和 String，

#### 共有属性

* name `string` 为字段名
* levelOfMeasurements `string[]` 可能的字段类型构成的数组，字段类型包括：Nominal Ordinal Interval Discrete Continuous Time

<!-- extends FieldInfo -->
* recommendation `TypeSpecifics` 推荐类型，包括 `'null' | 'boolean' | 'integer' | 'float' | 'date' | 'string'`
* type `TypeSpecifics | 'mixed'` 类型
* missing `number` 缺失值个数，包括 `null` `undefined` 和 `''`
* distinct `number` 唯一值个数
* valueMap `Record<string, number>` 每一个唯一值的个数映射
* count `number` 总数
* samples `any[]` 示例数值
* meta `FieldMeta` 只有当 type 为 `'mixed'` 时才会存在
```ts
interface FieldMeta {
    integer?: NumberFieldInfo;  
    float?: NumberFieldInfo;
    date?: DateFieldInfo;
    string?: StringFieldInfo;
}
```

#### DWAnalyzer.NumberFieldInfo

* zeros `number` 值为零的个数
* minimum `number` 最小值
* percentile5 `number` 5% 百分位
* percentile25 `number` 25% 百分位
* percentile50 `number` 50% 百分位
* percentile75 `number` 75% 百分位
* percentile95 `number` 95% 百分位
* maximum `number` 最大值
* standardDeviation `number` 标准差
* mean `number` 中位数
* sum `number` 求和
* variance `number` 方差

#### DWAnalyzer.DateFieldInfo

* minimum `string | number | Date` 最小日期
* maximum `string | number | Date` 最大日期

#### DWAnalyzer.StringFieldInfo

* maxLength `number` 最大长度
* minLength `number` 最小长度
* meanLength `number` 中间长度
* containsChar `boolean` 是否包含字母
* containsDigit `boolean` 是否包含数字
* containsSpace `boolean` 是否包含空格

### 示例

```ts
const data = [
  { "yearmonth": "2019-03", "gdp": 385, "city": "Paris" },
  { "yearmonth": "2019-04", "gdp": 888, "city": "Paris" },
  { "yearmonth": "2019-05", "gdp": 349, "city": "Paris" },
  { "yearmonth": "2019-06", "gdp": 468, "city": "Paris" },
  { "yearmonth": "2019-07", "gdp": 477, "city": "Paris" },
  { "yearmonth": "2019-03", "gdp": 291, "city": "London" },
  { "yearmonth": "2019-04", "gdp": 484, "city": "London" },
  { "yearmonth": "2019-05", "gdp": 293, "city": "London" },
  { "yearmonth": "2019-06", "gdp": 147, "city": "London" },
  { "yearmonth": "2019-07", "gdp": 618, "city": "London" }
]

dataToDataProps(data);

// [
//   { 
//     count: 10,
//     distinct: 5,
//     levelOfMeasurements: ["Time"],
//     maximum: "2019-07",
//     minimum: "2019-03",
//     missing: 0,
//     name: "yearmonth",
//     recommendation: "date",
//     samples: (10) ["2019-03", "2019-04", ...],
//     type: "date",
//     valueMap: {2019-03: 2, 2019-04: 2, 2019-05: 2, 2019-06: 2, 2019-07: 2}
//   },
//   ...
// ]
```

</div>
