---
title: 推荐规则
order: 0
---

`markdown:docs/common/style.md`

<!-- omit in toc -->
## 推荐规则一览

* [通用规则](#通用规则)
  * [bar-series-qty](#bar-series-qty)
  * [bar-without-axis-min](#bar-without-axis-min)
    * [相关链接](#相关链接)
  * [data-check](#data-check)
    * [适用图表类型](#适用图表类型)
    * [详细解释](#详细解释)
    * [相关链接](#相关链接-1)
  * [data-field-qty](#data-field-qty)
    * [适用图表类型](#适用图表类型-1)
    * [详细解释](#详细解释-1)
    * [相关链接](#相关链接-2)
  * [diff-pie-sector](#diff-pie-sector)
    * [适用图表类型](#适用图表类型-2)
    * [详细解释](#详细解释-2)
    * [相关链接](#相关链接-3)
  * [landscape-or-portrait](#landscape-or-portrait)
  * [limit-series](#limit-series)
  * [line-field-time-ordinal](#line-field-time-ordinal)
  * [no-redundant-field](#no-redundant-field)
  * [nominal-enum-combinatorial](#nominal-enum-combinatorial)
  * [purpose-check](#purpose-check)
  * [series-qty-limit](#series-qty-limit)
  * [x-axis-line-fading](#x-axis-line-fading)

## 通用规则

### bar-series-qty

条形图应该具有恰当数量的条形或条形组。

| Type | CA Default Weight |
| ---- | ----------------- |
| SOFT | 0.5               |

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
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### bar-without-axis-min

柱状图或条形图的数值轴的刻度应该从零开始。

| Type   | CA Default Weight |
| ------ | ----------------- |
| DESIGN | none              |

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
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### data-check

要想绘制出某类图表，至少要有它所必需的最小数据字段集合。

| Type | CA Default Weight |
| ---- | ----------------- |
| HARD | 1.0               |

#### 适用图表类型

所有图表类型。

#### 详细解释

每种图表类型都有自己必需的最小数据字段集合。比如要绘制一个柱状图，最少要有两个字段：一个名词型字段当做维度，展示在 x 轴；一个数值型字段当做度量，展示在 y 轴。当我们提供的数据集不符合这个标准，比如只有两个名词型字段，显然是无法绘制出一个柱状图的。本规则验证输入的数据集是否满足每一种图表类型的最小数据字段集合要求。

#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/data-check.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### data-field-qty

数据集的字段数量应该足够绘制图表。

| Type | CA Default Weight |
| ---- | ----------------- |
| HARD | 1.0               |

#### 适用图表类型

所有图表类型。

#### 详细解释

数据集包含的字段数量应该不小于图表所需的最小字段数量。

#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/data-field-qty.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### diff-pie-sector

饼图各扇区之间应该有足够大的差异。

| Type | CA Default Weight |
| ---- | ----------------- |
| SOFT | 0.5               |

#### 适用图表类型

  pie\_chart,
  donut\_chart

#### 详细解释

饼图各扇区之间应该有足够大的差异。否则读者很难看出细微的数据差异，这样一来饼图的就失去了其比较的功能。

#### 相关链接

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/diff-pie-sector.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### landscape-or-portrait

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/landscape-or-portrait.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### limit-series

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/limit-series.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### line-field-time-ordinal

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/line-field-time-ordinal.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### no-redundant-field

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/no-redundant-field.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### nominal-enum-combinatorial

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/nominal-enum-combinatorial.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### purpose-check

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/purpose-check.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### series-qty-limit

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/series-qty-limit.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### x-axis-line-fading

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/x-axis-line-fading.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>
