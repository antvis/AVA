---
title: 推荐规则
order: 0
---

<embed src='@/docs/common/style.md'></embed>
<!-- omit in toc -->
## 推荐规则一览

* [通用规则](#通用规则)
  * [data-check](#data-check)
  * [data-field-qty](#data-field-qty)
  * [no-redundant-field](#no-redundant-field)
  * [purpose-check](#purpose-check)
  * [bar-series-qty](#bar-series-qty)
  * [diff-pie-sector](#diff-pie-sector)
  * [landscape-or-portrait](#landscape-or-portrait)
  * [limit-series](#limit-series)
  * [line-field-time-ordinal](#line-field-time-ordinal)
  * [nominal-enum-combinatorial](#nominal-enum-combinatorial)
  * [series-qty-limit](#series-qty-limit)
  * [bar-without-axis-min](#bar-without-axis-min)
  * [x-axis-line-fading](#x-axis-line-fading)

## 通用规则

<!-- ****************************** Hard Rules ****************************** -->

### data-check

要想绘制出某类图表，至少要有它所必需的最小数据字段集合。

| 规则类型 | 默认权重 |
| -------- | -------- |
| HARD     | 1.0      |

<!-- omit in toc -->
#### 适用图表类型

所有图表类型。

<!-- omit in toc -->
#### 详细解释

每种图表类型都有自己必需的最小数据字段集合。比如要绘制一个柱状图，最少要有两个字段：一个名词型字段当做维度，展示在 x 轴；一个数值型字段当做度量，展示在 y 轴。当我们提供的数据集不符合这个标准，比如只有两个名词型字段，显然是无法绘制出一个柱状图的。本规则验证输入的数据集是否满足每一种图表类型的最小数据字段集合要求。

<!-- omit in toc -->
#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/data-check.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> 查看源码
</a>

<br><br>
<!-- ============================================================================== -->

### data-field-qty

数据集的字段数量应该足够绘制图表。

| 规则类型 | 默认权重 |
| -------- | -------- |
| HARD     | 1.0      |

<!-- omit in toc -->
#### 适用图表类型

所有图表类型。

<!-- omit in toc -->
#### 详细解释

数据集包含的字段数量应该不小于图表所需的最小字段数量。

<!-- omit in toc -->
#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/data-field-qty.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> 查看源码
</a>

<br><br>
<!-- ============================================================================== -->

### no-redundant-field

数据集中的所有字段应该都被分配到映射，没有多余的字段。

| 规则类型 | 默认权重 |
| -------- | -------- |
| HARD     | 1.0      |

<!-- omit in toc -->
#### 适用图表类型

所有图表类型。

<!-- omit in toc -->
#### 详细解释

基于经验的单图表推荐，默认每个字段都需要被用上，否则数据集字段的子集选择带来的可能性会指向不止一个的推荐结果。在默认每个字段都要被用上的情况下，会浪费字段的图表类型无法被推荐。比如数据集有三个字段，而基础饼图最多只能提供两个映射通道，饼图就不会被推荐。

<!-- omit in toc -->
#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/no-redundant-field.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> 查看源码
</a>

<br><br>
<!-- ============================================================================== -->

### purpose-check

如果用户指定了分析目的类型，只推荐能服务于这种分析目的的图表类型。

| 规则类型 | 默认权重 |
| -------- | -------- |
| HARD     | 1.0      |

<!-- omit in toc -->
#### 适用图表类型

所有图表类型。

<!-- omit in toc -->
#### 详细解释

分析目的包括比较、趋势、分布等等。每种图表类型都有自己能够服务的分析目的。比如饼图可以看对比、占比，但是不能看趋势。那么当用户指定了分析目的是趋势时，饼图显然就不用考虑了。

具体有哪些分析目的，每种图表类型能够服务于哪些分析目的，这些可以在 CKB 中查看。

<!-- omit in toc -->
#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/ckb/src/interface.ts#L34">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> CKB 中的分析目的
</a>
<br>

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/ckb/src/base.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> CKB 图表知识库
</a>
<br>

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/purpose-check.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> 查看源码
</a>

<br><br>
<!-- ============================================================================== -->

<!-- ****************************** Soft Rules ****************************** -->

### bar-series-qty

条形图应该具有恰当数量的条形或条形组。

| 规则类型 | 默认权重 |
| -------- | -------- |
| SOFT     | 0.5      |

<!-- omit in toc -->
#### 适用图表类型

  bar\_chart,
  grouped\_bar\_chart,
  stacked\_bar\_chart,
  percent\_stacked\_bar\_chart,
  column\_chart,
  grouped\_column\_chart,
  stacked\_column\_chart,
  percent\_stacked\_column\_chart

<!-- omit in toc -->
#### 详细解释

对于柱状图和条形图大类的图表来说，柱子的数量应该被控制在一个合理的范围内。当只有一根柱子时，其实没有必要使用柱状图，所以得零分。当柱子数量在 2 到 20 之间，我们认为这对于柱状图来说都是合理的，得 1 分。当柱子数量超过 20，柱子数量越多越不利于具体数值的展示，此时这条规则的分数为柱子数量和常量 20 的比值，数量越多分数越小，越趋近于 0。

<!-- omit in toc -->
#### 参考

*Luo, Yuyu, et al. "DeepEye: Towards Automatic Data Visualization." 2018 IEEE 34th International Conference on Data Engineering (ICDE). IEEE, 2018.*

<!-- omit in toc -->
#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/bar-series-qty.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> 查看源码
</a>

<br><br>
<!-- ============================================================================== -->

### diff-pie-sector

饼图各扇区之间应该有足够大的差异。

| 规则类型 | 默认权重 |
| -------- | -------- |
| SOFT     | 0.5      |

<!-- omit in toc -->
#### 适用图表类型

  pie\_chart,
  donut\_chart

<!-- omit in toc -->
#### 详细解释

饼图各扇区之间应该有足够大的差异。否则读者很难看出细微的数据差异，这样一来饼图的就失去了其比较的功能。

<!-- omit in toc -->
#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/diff-pie-sector.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> 查看源码
</a>

<br><br>
<!-- ============================================================================== -->

### landscape-or-portrait

竖向画布更推荐使用条形图，横向画布更推荐使用柱状图。

| 规则类型 | 默认权重 |
| -------- | -------- |
| SOFT     | 0.3      |

<!-- omit in toc -->
#### 适用图表类型

  bar\_chart,
  grouped\_bar\_chart,
  stacked\_bar\_chart,
  percent\_stacked\_bar\_chart,
  column\_chart,
  grouped\_column\_chart,
  stacked\_column\_chart,
  percent\_stacked\_column\_chart

<!-- omit in toc -->
#### 详细解释

当纵向空间更大时，尽可能利用纵向空间来放更多的柱子。横向空间同理。

<!-- omit in toc -->
#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/landscape-or-portrait.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> 查看源码
</a>

<br><br>
<!-- ============================================================================== -->

### limit-series

避免一种序列的值过多。

| 规则类型 | 默认权重 |
| -------- | -------- |
| SOFT     | 1.0      |

<!-- omit in toc -->
#### 适用图表类型

所有图表类型。

<!-- omit in toc -->
#### 详细解释

序列通常是指一个特定的易于区分的数据维度，比如商品类别，通常会用颜色等视觉通道来映射。当一个序列中包含太多值的时候会让读者不能清晰分辨。比如，想象一下一个柱状图上同时包含 20 种颜色。

<!-- omit in toc -->
#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/limit-series.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> 查看源码
</a>

<br><br>
<!-- ============================================================================== -->

### line-field-time-ordinal

包含时间或顺序性字段的数据适合用折线图或面积图来展示。

| 规则类型 | 默认权重 |
| -------- | -------- |
| SOFT     | 1.0      |

<!-- omit in toc -->
#### 适用图表类型

  line\_chart,
  area\_chart,
  stacked\_area\_chart,
  percent\_stacked\_area\_chart

<!-- omit in toc -->
#### 详细解释

数据集带有时间或顺序性字段时，通常需要分析其变化趋势，折线图或面积图非常符合大部分读者的心理预期。

<!-- omit in toc -->
#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/line-field-time-ordinal.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> 查看源码
</a>

<br><br>
<!-- ============================================================================== -->

### nominal-enum-combinatorial

当数据中包含至少两个名词型字段时，根据其值的重复性来推荐基础图表或分组图表。

| 规则类型 | 默认权重 |
| -------- | -------- |
| SOFT     | 1.0      |

<!-- omit in toc -->
#### 适用图表类型

  bar\_chart,
  column\_chart,
  grouped\_bar\_chart,
  grouped\_column\_chart,
  stacked\_bar\_chart,
  stacked\_column\_chart,

<!-- omit in toc -->
#### 详细解释

在考虑柱状图类的图表时，我们需要考虑什么情况下去推荐基础柱状图，什么时候去推荐分组柱状图。

推荐分组柱状图的前提是至少有两个维度构成一个层级关系。在层级关系中的上级层级，起码会出现维值上的重复。满足这个条件的更推荐分组型的图表。

<!-- omit in toc -->
#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/nominal-enum-combinatorial.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> 查看源码
</a>

<br><br>
<!-- ============================================================================== -->

### series-qty-limit

有一些图表类型中的序列的值不能太多。

| 规则类型 | 默认权重 |
| -------- | -------- |
| SOFT     | 0.8      |

<!-- omit in toc -->
#### 适用图表类型

  pie\_chart,
  donut\_chart,
  radar\_chart,
  rose\_chart

<!-- omit in toc -->
#### 详细解释

类似饼图、雷达图的一些图表，其中会有一个维度作为序列，其维值的数量决定了扇形的数量、轴的数量等。这个维值数量不宜过大，否则读者很难清晰地阅读图表。

<!-- omit in toc -->
#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/series-qty-limit.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> 查看源码
</a>

<br><br>
<!-- ============================================================================== -->

<!-- ****************************** Design Rules ****************************** -->

### bar-without-axis-min

柱状图或条形图的数值轴的刻度应该从零开始。

| 规则类型 | 默认权重 |
| -------- | -------- |
| DESIGN   | none     |

<!-- omit in toc -->
#### 适用图表类型

  bar\_chart,
  grouped\_bar\_chart,
  stacked\_bar\_chart,
  percent\_stacked\_bar\_chart,
  column\_chart,
  grouped\_column\_chart,
  stacked\_column\_chart,
  percent\_stacked\_column\_chart,

<!-- omit in toc -->
#### 详细解释

柱状图或条形图的数值轴不应该设置除 0 以外的最小值，否则可能会给读者带来数值对比上的误导。一个标准的修改方案是不设置其最小值或者设置为 0。

<!-- omit in toc -->
#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/bar-without-axis-min.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> 查看源码
</a>

<br><br>
<!-- ============================================================================== -->

### x-axis-line-fading

折线图 y 轴的值域应该设置在一个合理的范围。

| 规则类型 | 默认权重 |
| -------- | -------- |
| DESIGN   | none     |

<!-- omit in toc -->
#### 适用图表类型

  line_chart

<!-- omit in toc -->
#### 详细解释

对于折线图来说，趋势的展现是十分重要的。如果数值整体绝对值很大，而变化趋势很小，那么折线图会看起来很像是一根直线，难以看出波动。这种情况下可以适当调整 y 轴的值域（可以不从 0 开始）来让趋势变化达到读者可感知的程度。

<!-- omit in toc -->
#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/x-axis-line-fading.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> 查看源码
</a>
