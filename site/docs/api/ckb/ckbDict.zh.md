---
title: ckbDict
order: 2
---

<embed src='@/docs/common/style.md'></embed>


得到除英文外的所有语言词汇表。

```sign
ckbDict(lang: I18nLanguage): CkbDictionary
```

## 参数

* **lang** * 语言类型。
  * `参数类型`: _I18nLanguage_
  * `默认值`: 无

* _**I18nLanguage**_ 语言类型。

| Language Code(Value) | Language          |
| -------------------- | ----------------- |
| 'zh-CN'              | 简体中文(Chinese) |

当前仅包含中文，欢迎贡献其他语种。

## 返回值

_CkbDictionary_ extends object

完整的翻译内容结构的 TS 类型

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

## 示例

### 得到中文翻译对照表

```js
import { ckbDict } from '@antv/ava';


const cn = ckbDict('zh-CN');
```

### 手动进行中文翻译

得到所有中文坐标系名称选项。

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
