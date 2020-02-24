# 用户指南

* [图表类型](#图表类型)
* [分类的粒度](#分类的粒度)
* [分类的角度](#分类的角度)
  * [图形类别 graphic category](#图形类别-graphic-category)
  * [图表大类 chart family](#图表大类-chart-family)
  * [分析目的 purpose of analysis](#分析目的-purpose-of-analysis)
  * [坐标系 coordinate system](#坐标系-coordinate-system)
  * [形状 shape](#形状-shape)
  * [视觉通道 visual channel](#视觉通道-visual-channel)
  * [所需数据条件 data prerequisites](#所需数据条件-data-prerequisites)
    * [度量级别 level of measurement](#度量级别-level-of-measurement)
* [图表的基本信息](#图表的基本信息)
  * [名称 name](#名称-name)
  * [别名 alias](#别名-alias)
  * [定义 def](#定义-def)

## 图表类型

数据可视化图表有非常多种类，有些种类之间相近，有些种类直接区别较大。通过总结出各种图表类型的属性和适用场景，可以便于我们了解如何选择正确的图表。

比如我们常见的图表类型有：**折线图**、**柱状图**、**饼图**，等。

在 AVA/CKB 中，对每一个图表的类型的记录是类似这样的：（以基础饼图为例）

```js
basic_pie_chart: {
  id: 'basic_pie_chart',
  name: 'Pie Chart',
  alias: ['Circle Chart', 'Pie'],
  family: ['PieCharts'],
  def:
    'A pie chart is a chart that the classification and proportion of data are represented by the color and arc length (angle, area) of the sector.',
  purpose: ['Comparison', 'Composition', 'Proportion'],
  coord: ['Polar'],
  category: ['Statistic'],
  shape: ['Round'],
  dataPres: [
    { minQty: 1, maxQty: 1, fieldConditions: ['Nominal'] },
    { minQty: 1, maxQty: 1, fieldConditions: ['Interval'] },
  ],
  channel: ['Angle', 'Area', 'Color'],
},
```

这种记录具体是什么涵义呢，这篇文档会逐一解释。

## 分类的粒度

即使是我们常见的**折线图**，其实也可以分为更细节的类目。比如：**单折线**、**多折线**、**阶梯折线**，等等。**多折线**甚至可以细分为**单色多折线**、**多色多折线**。

分类太粗容易引起歧义，分类太细又觉得没有必要。我们在进行图表分类时，到底如何把握这个粒度呢？可以参考以下建议：

1. 定义分类的不同角度，作为分类依据。
2. 各角度都相同的图表类型，合为一类。
3. 从实用出发，普通读者不易于区分的图表拆为两类。


## 分类的角度

分类的角度大致有以下几种：

* 图形类别 graphic category
* 图表大类 chart family
* 分析目的 purpose of analysis
* 坐标系 coordinate system
* 形状 shape
* 视觉通道 visual channel
* 所需数据条件 data prerequisites

### 图形类别 graphic category

数据可视化中的图形可以按照结构和性质被分为几个大类。

在 CKB 中，图形类别的简写属性是 `category`。其形式是一个数组。其可选值包括：

* `Statistic` *统计图表* - 折线图、饼图等用来表示数据的统计或聚合结果的经典图表
* `Diagram` *示意图* - 弦图、桑基图等用来描述过程或状态的示意图
* `Graph` *关系图* - 图论概念中的图，由点线关系组成
* `Map` *地图* - 展示地理信息专用的图表

图形类别是比具体图表大类更高一级的分类，基本上是最高一级的分类。

### 图表大类 chart family

图表大类是比较细分一些的分类，会把概念上、形象上、其他分类角度上接近的图表归到一个*族类*。比如：**单折线**、**多折线**、**阶梯折线**都属于*折线图类*。**环图**和**饼图**都属于*饼图类*。

在 CKB 中，图表大类的简写属性是`family`。其形式是一个数组。其可选值包括：

* `LineCharts` *折线图类* - 单折线、多折线、阶梯折线，等
* `ColumnCharts` *柱状图类* - 单色柱状图、多色柱状图、分组柱状图、堆叠柱状图，等
* `BarCharts` *条形图类* - 单色条形图、多色条形图、分组条形图、堆叠条形图，等
* `PieCharts` *饼图类* - 饼图、环图，等
* `AreaCharts` *面积图类* - 面积图、叠加面截图、堆叠面积图、百分比堆叠面积图，等
* `ScatterCharts` *散点图类* - 散点图、气泡图，等
* `FunnelCharts` *漏斗图类* - 漏斗图、对称漏斗图，等
* `HeatmapCharts` *热力图类* - 热力图、不均匀热力图，等
* `RadarCharts` *雷达图类* - 单色雷达图、多色雷达图，等
* `Others` *其他分类*

### 分析目的 purpose of analysis

按照图表的分析目的分类，比如**饼图**更适合描述占比、**折线图**更适合描述趋势。

在 CKB 中，分析目的的简写属性是`purpose`。其形式是一个数组。其可选值包括：

* `Comparison` *对比*
* `Trend` *趋势*
* `Distribution` *分布*
* `Rank` *排名*
* `Proportion` *占比*
* `Composition` *成分*

### 坐标系 coordinate system

图表通常都是建立在某一种坐标系上的，通过坐标系也可以对图表进行分类。

在 CKB 中，坐标系的简写属性是`coord`。其形式是一个数组。其可选值包括：

* `NumberLine` *数轴* - 一维坐标系
* `Cartesian2D` *二维直角坐标系* - 又叫笛卡尔坐标系
* `SymmetricCartesian` *对称直角坐标系* - 在二维直角坐标系的基础上，图形以某一轴为中心向两侧发展
* `Cartesian3D` *三维直角坐标系* - 三维笛卡尔坐标系
* `Polar` *极坐标系* - 多用于圆形的图形布局
* `NodeLink` *点线网络* - 用于关系图
* `Radar` *雷达型坐标系* - 从一个中心点发散出的等角度多轴坐标系

### 形状 shape

基于对于图形的形状的感性认知，将图形分类。在界面设计、布局等场景下能有效对图表类型进行筛选。

在 CKB 中，形状的简写属性是`shape`。其形式是一个数组。其可选值包括：

* `Lines` *线形* - 如：多折线、平行坐标，等
* `Bars` *条形* - 如：柱状图、条形图、甘特图，等
* `Round` *圆形* - 如：饼图、雷达图，等
* `Square` *方形* - 如：树图、热力图，等
* `Area` *面积形* - 如：面积图、连续热力图，等
* `Scatter` *散点形* - 如：散点图、气泡图、词云，等
* `Symmetric` *对称形* - 如：漏斗图，等

### 视觉通道 visual channel

视觉通道是指可以用来映射数据的一些视觉元素变量，比如长度、形状、颜色等。通过对图表类型中的视觉通道进行整理，也可以将图表分类。

在 CKB 中，视觉通道的简写属性是`channel`。其形式是一个数组。其可选值包括：

* `Position` *位置*
* `Length` *长度*
* `Color` *颜色*
* `Area` *面积*
* `Angle` *角度*
* `ArcLength` *弧长*
* `Direction` *方向*
* `Size` *尺寸*

### 所需数据条件 data prerequisites

所需数据的先决条件，是指要制作出某个类型的图表，必须提供的数据结构。

在 CKB 中，数据条件的简写属性是`dataPres`。其形式是一个数组。数组的元素是必须符合以下格式的对象：

```js
{ minQty: 1, maxQty: 1, fieldConditions: ['Interval', 'Nominal'] }
```

这项条件的意思是：图表中有且只有 1 个 *数值* 或 *无序名词* 字段。

其中各属性的意义如下：

* `minQty` 该项条件最小需要满足的字段个数 - 大于等于 0 的整数
* `maxQty` 该项条件最大可以满足的字段个数 - 大于等于 minQty 的整数 或 `'*'` 表示无限
* `fieldConditions` 该项条件可以运用的**度量级别** - 数组，内部元素间是 *或* 的关系

#### 度量级别 level of measurement

* `Nominal` *无序名词* - 没有顺序意义的分类名词字段，如：[苹果，香蕉，草莓]
* `Ordinal` *有序名词* - 有顺序意义的分类名词字段，如：[第一名，第二名，第三名]
* `Interval` *数值* - 代表数量的字段
  * `Discrete` *离散数值* - 成员的间隔中没有意义，如：代表人数的整数字段，1.5 没有意义
  * `Continuous` *连续数值* - 成员的间隔中有意义，如：代表身高的字段，1.75 米有意义
* `Time` *日期时间* - 代表日期时间的字段

我们来看更多一些案例：

```js
...
  dataPres: [

    // 有且只有 1 个 日期时间 或 有序名词 字段
    { minQty: 1, maxQty: 1, fieldConditions: ['Time', 'Ordinal'] },

    // 有 0 到 1 （有或者没有） 个 无序名词 字段
    { minQty: 0, maxQty: 1, fieldConditions: ['Nominal'] },

    // 有 2 到 无限 （至少 2） 个 数值字段
    { minQty: 2, maxQty: '*', fieldConditions: ['Interval'] },
  ],
...
```

## 图表的基本信息

在依据分类确定了图表类型之后，我们还需要对图表的一些基本信息进行补充。

目前 CKB 中的基本信息包含三种：**名称**、**别名**、**定义**。

> 这三种信息是以文本字符串方式给出的，因此在不同语言翻译的时候要特别针对每个图表类型做国际化处理。

### 名称 name

图表的官方指定名称，通常以最广为人知的名称来命名。

### 别名 alias

图表的一些别名，以数组的形式罗列。

### 定义 def

图表的定义，对图表进行描述。
