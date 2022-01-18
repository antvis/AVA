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
  * [diff-pie-sector](#diff-pie-sector)
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

For large types of histograms and bar charts, the number of columns should be controlled within a reasonable range. When there is only one column, there is actually no need to use a histogram, so you get zero points. When the number of bars is between 2 and 20, we think this is reasonable for a histogram and score 1 point. When the number of columns exceeds 20, the larger the number of columns, the more unfavorable the display of specific values. At this time, the score of this rule is the ratio of the number of columns to the constant 20. The more the number, the smaller the score, and the closer it is to zero.

<!-- omit in toc -->
#### References

*Luo, Yuyu, et al. "DeepEye: Towards Automatic Data Visualization." 2018 IEEE 34th International Conference on Data Engineering (ICDE). IEEE, 2018.*

 <!-- omit in toc -->
#### Resources

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/bar-series-qty.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

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

Each chart type has its own minimum set of necessary data fields. For example, to plot a bar chart, there must be at least two fields: a nominal field as a dimension, displayed on the x-axis, and a quantitative field as a measure, displayed on the y-axis. When we provide a dataset that does not meet this criterion, for example, only one field, it is obviously impossible to draw a bar chart. This rule verifies that the input dataset meets the minimum set of data fields required for each chart type.

 <!-- omit in toc -->
#### Resources

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/data-check.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<!-- ============================================================================== -->

### data-field-qty

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/data-field-qty.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<!-- ============================================================================== -->

### diff-pie-sector

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 0.5               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/diff-pie-sector.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<!-- ============================================================================== -->

### landscape-or-portrait

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 0.3               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/landscape-or-portrait.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<!-- ============================================================================== -->

### limit-series

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/limit-series.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<!-- ============================================================================== -->

### line-field-time-ordinal

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/line-field-time-ordinal.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<!-- ============================================================================== -->

### no-redundant-field

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |


<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/no-redundant-field.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<!-- ============================================================================== -->

### nominal-enum-combinatorial

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |


<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/nominal-enum-combinatorial.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<!-- ============================================================================== -->

### purpose-check

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/purpose-check.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<!-- ============================================================================== -->

### series-qty-limit

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 0.8               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/series-qty-limit.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<!-- ============================================================================== -->

### x-axis-line-fading

| Type | CA Default Weight |
| ---- | ----------------- |
|      | none (1.0)        |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/x-axis-line-fading.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>
