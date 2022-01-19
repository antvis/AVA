---
title: Rules
order: 0
---

`markdown:docs/common/style.md`

<!-- omit in toc -->
## Rules List

* [General Rules](#general-rules)
  * [bar-series-qty](#bar-series-qty)
    * [Resources](#resources)
  * [bar-without-axis-min](#bar-without-axis-min)
    * [Resources](#resources-1)
  * [data-check](#data-check)
    * [Resources](#resources-2)
  * [data-field-qty](#data-field-qty)
    * [Resources](#resources-3)
  * [diff-pie-sector](#diff-pie-sector)
    * [Resources](#resources-4)
  * [landscape-or-portrait](#landscape-or-portrait)
  * [limit-series](#limit-series)
  * [line-field-time-ordinal](#line-field-time-ordinal)
  * [no-redundant-field](#no-redundant-field)
  * [nominal-enum-combinatorial](#nominal-enum-combinatorial)
  * [purpose-check](#purpose-check)
  * [series-qty-limit](#series-qty-limit)
  * [x-axis-line-fading](#x-axis-line-fading)

## General Rules

### bar-series-qty

A Bar chart should has proper number of bars or bar groups.

| Type | CA Default Weight |
| ---- | ----------------- |
| SOFT | 0.5               |

<!-- omit in toc -->
#### Applicable chart types

  bar\_chart,
  grouped\_bar\_chart,
  stacked\_bar\_chart,
  percent\_stacked\_bar\_chart,
  column\_chart,
  grouped\_column\_chart,
  stacked\_column\_chart,
  percent\_stacked\_column\_chart

<!-- omit in toc -->
#### Rule Details

For bar charts and column charts, the number of bars should be kept within a reasonable range. When there is only one bar, there is really no need to use a bar chart (could use a KPI panel or just show the number), so a score of zero is given. When the number of bars is between 2 and 20, we consider this to be reasonable for a bar chart, and a score of 1 is given. When the number of bars exceeds 20, the more bars are not good for the display of specific values, so the score of this rule is the ratio of the number of bars to the constant 20, and the more the number the smaller the score, the closer to 0.

<!-- omit in toc -->
#### References

*Luo, Yuyu, et al. "DeepEye: Towards Automatic Data Visualization." 2018 IEEE 34th International Conference on Data Engineering (ICDE). IEEE, 2018.*

 <!-- omit in toc -->
#### Resources

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/bar-series-qty.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### bar-without-axis-min

The measure axis of a bar chart or column chart should start with zero.

| Type   | CA Default Weight |
| ------ | ----------------- |
| DESIGN | none              |

<!-- omit in toc -->
#### Applicable chart types

  bar\_chart,
  grouped\_bar\_chart,
  stacked\_bar\_chart,
  percent\_stacked\_bar\_chart,
  column\_chart,
  grouped\_column\_chart,
  stacked\_column\_chart,
  percent\_stacked\_column\_chart,

<!-- omit in toc -->
#### Rule Details

It is not recommended to set the minimum value of axis for the bar or column chart. Otherwise, the graphics may mislead the reader in numerical comparison. A standard fix is to remove the minimum value config of axis.

 <!-- omit in toc -->
#### Resources

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/bar-without-axis-min.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### data-check

To be able to plot a certain type of chart, you must have at least the minimum set of data fields necessary for it.

| Type | CA Default Weight |
| ---- | ----------------- |
| HARD | 1.0               |

<!-- omit in toc -->
#### Applicable chart types

 All chart types.

<!-- omit in toc -->
#### Rule Details

Each chart type has its own minimum set of necessary data fields. For example, to plot a bar chart, there must be at least two fields: a nominal field as a dimension, displayed on the x-axis, and a quantitative field as a measure, displayed on the y-axis. When we provide a dataset that does not meet this criterion, for example, with only two nominal fields, it is obviously impossible to draw a bar chart. This rule verifies that the input dataset meets the minimum set of data fields required for each chart type.

 <!-- omit in toc -->
#### Resources

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/data-check.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### data-field-qty

Data must have at least the min qty of the prerequisite.

| Type | CA Default Weight |
| ---- | ----------------- |
| HARD | 1.0               |

<!-- omit in toc -->
#### Applicable chart types

 All chart types.

<!-- omit in toc -->
#### Rule Details

The dataset should contain no less than the minimum number of fields required for the chart type.

 <!-- omit in toc -->
#### Resources

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/data-field-qty.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### diff-pie-sector

The difference between sectors of a pie chart should be large enough.

| Type | CA Default Weight |
| ---- | ----------------- |
| SOFT | 0.5               |

<!-- omit in toc -->
#### Applicable chart types

  pie\_chart,
  donut\_chart

<!-- omit in toc -->
#### Rule Details

The difference between sectors of a pie chart should be large enough. Otherwise, it is difficult for the reader to see the subtle differences in the data, so the pie chart loses its comparative function.

 <!-- omit in toc -->
#### Resources

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/diff-pie-sector.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### landscape-or-portrait

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 0.3               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/landscape-or-portrait.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### limit-series

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/limit-series.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### line-field-time-ordinal

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/line-field-time-ordinal.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### no-redundant-field

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |


<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/no-redundant-field.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### nominal-enum-combinatorial

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |


<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/nominal-enum-combinatorial.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### purpose-check

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/purpose-check.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### series-qty-limit

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 0.8               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/series-qty-limit.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### x-axis-line-fading

| Type | CA Default Weight |
| ---- | ----------------- |
|      | none (1.0)        |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/x-axis-line-fading.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>
