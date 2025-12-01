---
title: 数据抽取(extract)
order: 0
redirect_from:
  - /zh/docs/guide/tech/extract
---

`extract` 是一个数据处理模块，可以处理抽取结构化和非结构化数据。

<div style="display:flex;justify-content:center">
  <img style="height: 400px;align: center" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*aRzfT5N-ZvsAAAAAgFAAAAgAemJ7AQ/original"></img>
</div>

## 🔨 使用

### 示例：从自然语言抽取关系型数据

更多示例可参考 **[使用示例](/examples#extract-structure)**
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
    '网络中有以下设备：一个服务器（Server），两台个人电脑（PC1, PC2）和一个打印机（Printer）。服务器连接到PC1和PC2，而PC1和PC2都连接到打印机。'
  );
  return structureData;
}
```

## ✨ 功能特性

### 从自然语言中抽取数据

`extract` 方法可读取 JSONString 或者任意自然语言输入，并从中抽取数据信息，将其转化为结构化数据输出。目前可以识别三类结构化数据：
- plain 二维表格的明细数据；
- relation 关系型数据；
- hierarchy 层级数据；

### 统计特征计算
明细数据抽取后会默认计算数据特征。统计特征详见 **[statistics](#statistics)**;
例如：

```ts
const data = await ava.extract(`2021 年公司不同部门的预算分配，研发部 50 百万美元，市场部 40 百万美元，销售部 60 百万美元，行政部 20 百万美元`);
```
会得到以下输出：
```json
{
  "shape": "plain",
  "data": [
    {
      "department": "研发部",
      "budget": 50000000
    },
    {
      "department": "市场部",
      "budget": 40000000
    },
    {
      "department": "销售部",
      "budget": 60000000
    },
    {
      "department": "行政部",
      "budget": 20000000
    }
  ],
  "metas": [
    {
      "id": "department",
      "name": "部门",
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
          "研发部",
          "市场部",
          "销售部",
          "行政部"
        ],
        "valueMap": {
          "研发部": 1,
          "市场部": 1,
          "销售部": 1,
          "行政部": 1
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
      "name": "预算",
      "dataType": "number",
      "unit": "美元",
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
    "name": "预算",
    "key": "budget",
    "purpose": "Comparison"
  }
}
```

## statistics
<a id="statistics"></a>

### min

计算数组最小值。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { min } from '@antv/ava';

min([1, 2, 3, 201, 999, 4, 5, 10]);
// 1
```

### max

计算数组最大值。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { max } from '@antv/ava';

max([1, 2, 3, 201, 999, 4, 5, 10]);
// 999
```

### maxabs

计算数组中绝对值最大的数值。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { maxabs } from '@antv/ava';

maxabs([1, 2, 3, -201, -999, 4, 5, 10]);
// 999
```

### sum

计算数组值之和。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { sum } from '@antv/ava';

sum([1, 2, 3, 201, 999, 4, 5, 10]);
// 1225
```

### median

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
import { median } from '@antv/ava';

median([1, 2, 3, 201, 999, 4, 5, 10]);
// 4.5
```

### quartile

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
import { quartile } from '@antv/ava';

quartile([1, 2, 3, 201, 999, 4, 5, 10]);
// [ 2.5, 4.5, 105.5 ]
```

### quantile

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
import { quantile } from '@antv/ava';

quantile([1, 2, 3, 201, 999, 4, 5, 10], 75);
// 10
```

### mean

计算数组的平均数。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { mean } from '@antv/ava';

mean([1, 2, 3, 201, 999, 4, 5, 10]);
// 153.125
```

### geometricMean

计算数组的几何平均数。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { geometricMean } from '@antv/ava';

geometricMean([1, 2, 3, 201, 999, 4, 5, 10]);
// 11.162021352303842
```

### harmonicMean

计算数组的调和平均数。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { harmonicMean } from '@antv/ava';

harmonicMean([1, 2, 3, 201, 999, 4, 5, 10]);
// 3.34824774196937
```

### variance

计算数组的方差。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { variance } from '@antv/ava';

variance([1, 2, 3, 201, 999, 4, 5, 10]);
// 106372.359375
```

### standardDeviation

计算数组的标准差。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { standardDeviation } from '@antv/ava';

standardDeviation([1, 2, 3, 201, 999, 4, 5, 10]);
// 326.1477569676051
```

### coefficientOfVariance

计算数组的变异系数。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `number[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { coefficientOfVariance } from '@antv/ava';

coefficientOfVariance([1, 2, 3, 201, 999, 4, 5, 10]);
// 2.1299445352986455
```

### covariance

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
import { covariance } from '@antv/ava';

covariance([1, 2, 3, 201, 999, 4, 5, 10], [12, 22, 23, 2201, 2999, 24, 25, 210]);
// 324526.3125
```

### pearson

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
import { pearson } from '@antv/ava';

pearson([1, 2, 3, 201, 999, 4, 5, 10], [12, 22, 23, 2201, 2999, 24, 25, 210]);
// 0.8863724626851197
```

### valid

计算数组中的合法值个数，`undefined`、`null`、`NaN` 等可转换为 `false` 的值，均视为非法值。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `any[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { valid } from '@antv/ava';

valid([1, 2, NaN, 201, undefined, 4, 5, null]);
// 5
```

### missing

计算数组中缺失值的个数，和 `valid` 方法互补。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `any[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { missing } from '@antv/ava';

missing([1, 2, NaN, 201, undefined, 4, 5, null]);
// 3
```

### valueMap

统计数组中独立值的个数，以独立值本身为 key，个数为 value，生成对象。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `any[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { valueMap } from '@antv/ava';

valueMap([1, 2, 3, 201, 999, 4, 5, 10]);
// { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '10': 1, '201': 1, '999': 1 }
```

### distinct

统计数组中独立值的个数。

***<font size=4>参数</font>***

**array** 原数组数据 _必选_

类型 `any[]`

***<font size=4>返回值</font>***

`number`

***<font size=4>用法</font>***

```ts
import { distinct } from '@antv/ava';

distinct([1, 2, 3, 201, 999, 4, 5, 10]);
// 8
```
