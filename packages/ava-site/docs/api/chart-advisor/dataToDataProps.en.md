---
title: dataToDataProps
order: 1
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
dataToDataProps(data: any[]): DataProperty[]
```

### Arguments

* **data** * Dataset.
  * _required_
  * `type`: any[]

### Returns

*`DataProperty[]`* 

```ts
type DataProperty =
  | (DWAnalyzer.NumberFieldInfo & { name: string; levelOfMeasurements: LOM[] })
  | (DWAnalyzer.DateFieldInfo & { name: string; levelOfMeasurements: LOM[] })
  | (DWAnalyzer.StringFieldInfo & { name: string; levelOfMeasurements: LOM[] });
```

* `name`: name of field

* `levelOfMeasurements`: Nominal Ordinal Interval Discrete Continuous Time

#### DWAnalyzer.NumberFieldInfo

* zeros `number`
* minimum `number`
* percentile5 `number`
* percentile25 `number`
* percentile50 `number`
* percentile75 `number`
* percentile95 `number` 
* maximum `number` 
* stdev `number` 
* mean `number` 
* sum `number` 
* variance `number` 

#### DWAnalyzer.DateFieldInfo

* minimum `string | number | Date` 
* maximum `string | number | Date` 

#### DWAnalyzer.StringFieldInfo

* maxLength `number` 
* minLength `number` 
* meanLength `number` 
* containsChars `boolean` 
* containsDigits `boolean` 
* containsSpace `boolean` 
* containsNonWorlds `boolean` 

### Examples

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
