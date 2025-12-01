---
title: Data Extraction (extract)
order: 0
redirect_from:
  - /en/docs/guide/tech/extract
---

`extract` is a data processing module capable of extracting structured and unstructured data.

<div style="display:flex;justify-content:center">
  <img style="height: 400px;align: center" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*pJ-9TJUrKHcAAAAAgFAAAAgAemJ7AQ/original"></img>
</div>

## 🔨 Usage

### Example: Extracting Relational Data from Natural Language

For more examples, please refer to **[Usage Examples](/examples#extract-structure)**.
```ts
import { AVA } from '@antv/ava';

const ava = new AVA({
  llm: {
    appId: 'your tbox appId',
    authorization: 'your tbox authorization',
  },
});

const extract = async () => {
  const structureData = await ava.extract(
    'The network includes the following devices: one server (Server), two personal computers (PC1, PC2), and one printer (Printer). The server is connected to PC1 and PC2, while both PC1 and PC2 are connected to the printer.'
  );
  return structureData;
}
```

## ✨ Features

### Extract Data from Natural Language

The `extract` method accepts inputs in the form of JSON strings or arbitrary natural language text, extracts relevant data, and converts it into structured output. Currently, it supports recognizing three types of structured data:
- **plain**: Detailed tabular data (two-dimensional);
- **relation**: Relational data;
- **hierarchy**: Hierarchical data;

### Statistical Feature Computation

After extracting detailed (tabular) data, statistical features are computed by default. For details on available statistics, see [statistics](#statistics).

For example:

```ts
const data = await ava.extract(`Budget allocations for different departments in 2021: R&D Department 50 million USD, Marketing Department 40 million USD, Sales Department 60 million USD, Administration Department 20 million USD`);
```

This will produce the following output:
```json
{
  "shape": "plain",
  "data": [
    {
      "department": "R&D Department",
      "budget": 50000000
    },
    {
      "department": "Marketing Department",
      "budget": 40000000
    },
    {
      "department": "Sales Department",
      "budget": 60000000
    },
    {
      "department": "Administration Department",
      "budget": 20000000
    }
  ],
  "metas": [
    {
      "id": "department",
      "name": "Department",
      "dataType": "string",
      "statisticsFeature": {
        "name": "department",
        "count": 4,
        "distinct": 4,
        "types": [
          "string"
        ],
        "recommendation": "string",
        "missing": 0,
        "rawData": [
          "R&D Department",
          "Marketing Department",
          "Sales Department",
          "Administration Department"
        ],
        "valueMap": {
          "R&D Department": 1,
          "Marketing Department": 1,
          "Sales Department": 1,
          "Administration Department": 1
        },
        "maxLength": 3,
        "minLength": 3,
        "meanLength": 3,
        "containsChar": false,
        "containsDigit": false,
        "containsSpace": false,
        "levelOfMeasurements": [
          "Nominal"
        ]
      }
    },
    {
      "id": "budget",
      "name": "Budget",
      "dataType": "number",
      "unit": "USD",
      "statisticsFeature": {
        "name": "budget",
        "count": 4,
        "distinct": 4,
        "types": [
          "number"
        ],
        "recommendation": "number",
        "missing": 0,
        "rawData": [
          50000000,
          40000000,
          60000000,
          20000000
        ],
        "valueMap": {
          "20000000": 1,
          "40000000": 1,
          "50000000": 1,
          "60000000": 1
        },
        "minimum": 20000000,
        "maximum": 60000000,
        "mean": 42500000,
        "percentile5": 20000000,
        "percentile25": 20000000,
        "percentile50": 40000000,
        "percentile75": 50000000,
        "percentile95": 60000000,
        "sum": 170000000,
        "variance": 218750000000000,
        "standardDeviation": 14790199.45774904,
        "zeros": 0,
        "levelOfMeasurements": [
          "Interval",
          "Discrete",
          "Continuous"
        ]
      }
    }
  ],
  "purpose": {
    "name": "Budget",
    "key": "budget",
    "purpose": "Comparison"
  }
}
```

## Statistics
<a id="statistics"></a>

### min

Computes the minimum value in an array.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `number[]`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { min } from '@antv/ava';

min([1, 2, 3, 201, 999, 4, 5, 10]);
// 1
```

### max

Computes the maximum value in an array.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `number[]`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { max } from '@antv/ava';

max([1, 2, 3, 201, 999, 4, 5, 10]);
// 999
```

### maxabs

Finds the number with the largest absolute value in an array.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `number[]`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { maxabs } from '@antv/ava';

maxabs([1, 2, 3, -201, -999, 4, 5, 10]);
// 999
```

### sum

Calculates the sum of all values in an array.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `number[]`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { sum } from '@antv/ava';

sum([1, 2, 3, 201, 999, 4, 5, 10]);
// 1225
```

### median

Computes the median of an array.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `number[]`

**sorted** Whether the input array is already sorted _Optional_

Type: `boolean`

Default: `false`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { median } from '@antv/ava';

median([1, 2, 3, 201, 999, 4, 5, 10]);
// 4.5
```

### quartile

Computes the first, second, and third quartiles (Q1, Q2, Q3) of an array.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `number[]`

**sorted** Whether the input array is already sorted _Optional_

Type: `boolean`

Default: `false`

***<font size=4>Return Value</font>***

`number[]` — Returns an array `[Q1, Q2 (median), Q3]`

***<font size=4>Usage</font>***

```ts
import { quartile } from '@antv/ava';

quartile([1, 2, 3, 201, 999, 4, 5, 10]);
// [2.5, 4.5, 105.5]
```

### quantile

Computes the specified percentile of an array.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `number[]`

**percent** Percentile to compute (e.g., 25 for 25th percentile) _Required_

Type: `number`

**sorted** Whether the input array is already sorted _Optional_

Type: `boolean`

Default: `false`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { quantile } from '@antv/ava';

quantile([1, 2, 3, 201, 999, 4, 5, 10], 75);
// 105.5
```

### mean

Computes the arithmetic mean (average) of an array.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `number[]`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { mean } from '@antv/ava';

mean([1, 2, 3, 201, 999, 4, 5, 10]);
// 153.125
```

### geometricMean

Computes the geometric mean of an array.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `number[]`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { geometricMean } from '@antv/ava';

geometricMean([1, 2, 3, 201, 999, 4, 5, 10]);
// 11.162021352303842
```

### harmonicMean

Computes the harmonic mean of an array.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `number[]`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { harmonicMean } from '@antv/ava';

harmonicMean([1, 2, 3, 201, 999, 4, 5, 10]);
// 3.34824774196937
```

### variance

Computes the variance of an array.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `number[]`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { variance } from '@antv/ava';

variance([1, 2, 3, 201, 999, 4, 5, 10]);
// 106372.359375
```

### standardDeviation

Computes the standard deviation of an array.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `number[]`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { standardDeviation } from '@antv/ava';

standardDeviation([1, 2, 3, 201, 999, 4, 5, 10]);
// 326.1477569676051
```

### coefficientOfVariance

Computes the coefficient of variation (CV), defined as standard deviation divided by mean.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `number[]`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { coefficientOfVariance } from '@antv/ava';

coefficientOfVariance([1, 2, 3, 201, 999, 4, 5, 10]);
// 2.1299445352986455
```

### covariance

Computes the covariance between two arrays.

***<font size=4>Parameters</font>***

**x** First array _Required_

Type: `number[]`

**y** Second array _Required_

Type: `number[]`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { covariance } from '@antv/ava';

covariance([1, 2, 3, 201, 999, 4, 5, 10], [12, 22, 23, 2201, 2999, 24, 25, 210]);
// 324526.3125
```

### pearson

Computes the Pearson correlation coefficient between two arrays.

***<font size=4>Parameters</font>***

**x** First array _Required_

Type: `number[]`

**y** Second array _Required_

Type: `number[]`

***<font size=4>Return Value</font>***

`number` — A value between -1 and 1 indicating linear correlation.

***<font size=4>Usage</font>***

```ts
import { pearson } from '@antv/ava';

pearson([1, 2, 3, 201, 999, 4, 5, 10], [12, 22, 23, 2201, 2999, 24, 25, 210]);
// 0.8863724626851197
```

### valid

Counts the number of valid (non-nullish/non-NaN) elements in an array. Values like `undefined`, `null`, or `NaN` are considered invalid.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `any[]`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { valid } from '@antv/ava';

valid([1, 2, NaN, 201, undefined, 4, 5, null]);
// 5
```

### missing

Counts the number of missing (invalid) values in an array. This complements the `valid` method.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `any[]`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { missing } from '@antv/ava';

missing([1, 2, NaN, 201, undefined, 4, 5, null]);
// 3
```

### valueMap

Generates a map object where keys are unique values from the array and values are their respective counts.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `any[]`

***<font size=4>Return Value</font>***

`Object<string, number>` — A key-value map of values and their frequencies.

***<font size=4>Usage</font>***

```ts
import { valueMap } from '@antv/ava';

valueMap([1, 2, 3, 201, 999, 4, 5, 10]);
// { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '10': 1, '201': 1, '999': 1 }
```

### distinct

Counts the number of unique (distinct) values in an array.

***<font size=4>Parameters</font>***

**array** Original array data _Required_

Type: `any[]`

***<font size=4>Return Value</font>***

`number`

***<font size=4>Usage</font>***

```ts
import { distinct } from '@antv/ava';

distinct([1, 2, 3, 201, 999, 4, 5, 10]);
// 8
```
