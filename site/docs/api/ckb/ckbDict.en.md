---
title: ckbDict
order: 2
---

<embed src='@/docs/common/style.md'></embed>


Get CKB dictionary of specific language except English.

```sign
ckbDict(lang: I18nLanguage): CkbDictionary
```

## Parameters

* **lang** * Language Code.
  * `type`: _I18nLanguage_
  * `default`: None

* _**I18nLanguage**_ Language Code other than en-US.

| Language Code(Value) | Language          |
| -------------------- | ----------------- |
| 'zh-CN'              | 简体中文(Chinese) |

Currently only Chinese is included, contributions in other languages are welcome.

## Return value

_CkbDictionary_ extends object

TS type of complete translation dictionary of a CKB.

```js
{
  concepts: {
    family: {
      LineCharts: '折线图类',
      ColumnCharts: '柱状图类',
      BarCharts: '条形图类',
      ...
    },
    category: {
      Statistic: '统计图表',
      Diagram: '示意图',
      Graph: '关系图',
      ...
    },
    purpose: { ... },
    coord: { ... },
    ...
  },
  chartTypes: {
    line_chart: {
      name: '折线图',
      alias: ['折线图', '线图'],
      def: '使用折线的线段显示数据在一个具有顺序性的维度上的变化。',
    },
    step_line_chart: { ... },
    area_chart: { ... },
    ...
  },
};
```

## Examples

### Get Chinese translation cross-reference table

```js
import { ckbDict } from '@antv/ava';


const cn = ckbDict('zh-CN');
```

### Manual Chinese translation

Get all the Chinese coordinate system name options.

```js
import { COORDINATE_SYSTEMS, ckbDict } from '@antv/ava';


const cn = ckbDict('zh-CN');
const cnCoordOptions = COORDINATE_SYSTEMS.map((coord) => cn.concepts.coord[coord]);

expect(cnCoordOptions).toEqual([
  '数轴',
  '二维直角坐标系',
  '对称直角坐标系',
  '三维直角坐标系',
  '极坐标系',
  '点线关系网络',
  '雷达型坐标系',
  '地理坐标系',
  '其他',
]);
```
