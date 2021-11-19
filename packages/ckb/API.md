# API Reference

*`Functions`*

----

## `CKBJson([lang='en-US'], [completed=false])`

> Creates a **Chart Knowledge Base** in `JSON` format.

***<font size=4>Parameters</font>***


* **lang** * Language of the CKB content.
  * `optional`
  * `type`: *Language* extends string
  * `default`: 'en-US'
  * `options`:
    * 'en-US'
    * 'zh-CN'

* **completed** * To include incompleted charts or not.
  * `optional`
  * `type`: *boolean*
  * `default`: false

***<font size=4>Return value</font>***


*ChartKnowledgeBaseJSON* extends object

```js
{
  single_line_chart: {
    id: 'single_line_chart',
    name: 'Single Line Chart',
    alias: ['Line', 'Line Chart', 'Basic Line Chart'],
    family: ['LineCharts'],
    def:
      'A single line chart is a chart that uses one line with segments to show changes in data in a ordinal dimension.',
    purpose: ['Trend'],
    coord: ['Cartesian2D'],
    category: ['Statistic'],
    shape: ['Lines'],
    dataPres: [
      { minQty: 1, maxQty: 1, fieldConditions: ['Time', 'Ordinal'] },
      { minQty: 1, maxQty: 1, fieldConditions: ['Interval'] },
    ],
    channel: ['Position', 'Direction'],
  },

  ...
}
```

***<font size=4>Examples</font>***


```js
import { CKBJson } from '@antv/knowledge';


// Knowledage base for all charts in English.
const knowledgeBase = CKBJson();

// Knowledage base for all charts in Chinese.
const zhKB = CKBJson('zh-CN');

// Knowledage base for completed charts in English.
const completedKB = CKBJson(undefined, true);

// Knowledage base for completed charts in Chinese.
const zhCompletedKB = CKBJson('zh-CN', true);
```

## `addChart(chartKnowledge, trans)`

> deprecated

> Adds a custom chart to the base.

***<font size=4>Parameters</font>***


* **chartKnowledge** * Chart Knowledge object for the custom chart.
  * `required`
  * `type`: *ChartKnowledge* extends object

* **trans** * To include incompleted charts or not.
  * `required`
  * `type`: *Record<Language, TransKnowledgeProps>*

***<font size=4>Return value</font>***


*`void`*

***<font size=4>Examples</font>***


```ts
const liquid_diagram = {
  id: 'liquid_diagram',
  name: 'Liquid Diagram',
  alias: ['Liquid Chart'],
  family: ['Others'],
  def: 'A liquid diagram is a infographic for presenting progress.',
  purpose: ['Comparison'],
  coord: [],
  category: ['Diagram'],
  shape: ['Lines'],
  dataPres: [{ minQty: 1, maxQty: 1, fieldConditions: ['Interval'] }],
  channel: ['Position'],
};

const liquid_diagram_trans = {
  name: '水波图',
  alias: ['水波球', '进度球'],
  def: '水波图是一种用球形容器和其中的水平线位置来表示进度的示意图。',
};

addChart(
  liquid_diagram as ChartKnowledge,
  { 'zh-CN': liquid_diagram_trans } as Record<Language, TransKnowledgeProps>
);
```

## `CKBOptions([lang='en-US'])`

> Returns all possible options for each property of Chart Knowledge.

***<font size=4>Parameters</font>***


* **lang** * Language of property options.
  * `optional`
  * `type`: *Language* extends string
  * `default`: 'en-US'
  * `options`:
    * 'en-US'
    * 'zh-CN'

***<font size=4>Return value</font>***


*object* * contains the following keys:

### `CKBOptions().family`

> Types of chart similarity or so called *Chart Family*.

* LineCharts
* ColumnCharts
* BarCharts
* PieCharts
* AreaCharts
* ScatterCharts
* FunnelCharts
* HeatmapCharts
* RadarCharts
* Others

### `CKBOptions().category`

> Types of higher level of chart taxonomy or so called *Graphic Category*.

* Statistic
* Diagram
* Graph
* Map

### `CKBOptions().purpose`

> Types of purpose for which the visualization is used.

* Comparison
* Trend
* Distribution
* Rank
* Proportion
* Composition

### `CKBOptions().coord`

> Types of *Coordinate Systems*.

* NumberLine
* Cartesian2D
* SymmetricCartesian
* Cartesian3D
* Polar
* NodeLink
* Radar

### `CKBOptions().shape`

> Shapes of the skeleton of visualization.

* Lines
* Bars
* Round
* Square
* Area
* Scatter
* Symmetric

### `CKBOptions().channel`

> *Visual Channels*.

* Position
* Length
* Color
* Area
* Angle
* ArcLength
* Direction
* Size

### `CKBOptions().lom`

> *Level of Measurement*.

* Nominal
* Ordinal
* Interval
* Discrete
* Continuous
* Time

***<font size=4>Examples</font>***


```js
import { CKBOptions } from '@antv/knowledge';

const options1 = CKBOptions();
const options2 = CKBOptions('zh-CN');

const allCategories = options1.category;
// ['Statistic', 'Diagram', 'Graph', 'Map']
```

*`Types & Interfaces`*

----

```js
import { ChartKnowledge, DataPrerequisite } from '@antv/knowledge';
```

## `ChartKnowledge`

```ts
interface ChartKnowledge {
  id: ChartID;
  name: string;
  alias: string[];
  family?: Family[];
  def?: string;
  purpose?: Purpose[];
  coord?: CoordinateSystem[];
  category?: GraphicCategory[];
  shape?: Shape[];
  dataPres?: DataPrerequisite[];
  channel?: Channel[];
}
```

## `DataPrerequisite`

```ts
interface DataPrerequisite {
  minQty: number;
  maxQty: number | '*';
  fieldConditions: LevelOfMeasurement[];
}
```

## `Language`

```ts
type Language = 'en-US' | 'zh-CN';
```

## `TransKnowledgeProps`

```ts
interface TransKnowledgeProps {
  name: string;
  alias: string[];
  def: string;
}
```
