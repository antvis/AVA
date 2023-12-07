---
title: Rules
order: 1
---

<embed src='@/docs/common/style.md'></embed>
<!-- omit in toc -->

## Introduction

`advisor` module is based on rules for chart recommendation and optimization, divided into three main categories of rules:
1. Hard Rules: Rules that must be satisfied, and if the chart type cannot satisfy any of the rules in the hard rule set, it will not appear in the final list of recommended charts.
2. Soft Rules: Rules that are recommended to be satisfied, used for scoring charts and giving suggestions, the higher the score, the more suitable it is to use the corresponding chart type.
3. Design Rules: Rules for optimizing the chart spec.

By default, the chart recommendation rules are used built-in recommendation rules for chart recommendation, and in addition, rules can be switched, configured, and customized with users' own rules.
```js
// custom rule Config
const myRuleCfg = {
  // not use data-field-qty rule
  exclude: ['limit-series'],
  // add a custom rule
  custom: {
    'no-line-chart-with-year': myRule,
  },
  options: {
    // customize rule options
    'diff-pie-sector': {
      weight: 0.8
    }
  }
};

const myAdvisor = new Advisor({ ruleCfg: myRuleCfg });
```

Details of `ruler` module can be found in：[Ruler API](../../api/advice/Ruler.zh.md)。

## Rules List

* [Hard Rules](#hard-rules)
  * [data-check](#data-check): Having the minimum set of data fields necessary for a given chart type
  * [data-field-qty](#data-field-qty): Data must have at least the min qty of the prerequisite.
  * [no-redundant-field](#no-redundant-field): All fields should be assigned to a visual mapping.
  * [purpose-check](#purpose-check): Choose chart types that satisfy the purpose, if purpose is defined.
* [Soft Rules](#soft-rules)
  * [bar-series-qty](#bar-series-qty): A Bar chart should has proper number of bars or bar groups.
  * [diff-pie-sector](#diff-pie-sector): The difference between sectors of a pie chart should be large enough.
  * [landscape-or-portrait](#landscape-or-portrait): 
Recommend column charts for landscape layout and bar charts for portrait layout.
  * [limit-series](#limit-series): Avoid too many values in one series.
  * [line-field-time-ordinal](#line-field-time-ordinal): Data containing time or ordinal fields are suitable for line or area charts.
  * [nominal-enum-combinatorial](#nominal-enum-combinatorial): Basic (column, bar) charts or grouped (or stacked) charts are recommended based on the repetition of dimension values.
  * [series-qty-limit](#series-qty-limit): Some charts should has at most N values for the series.
* [Design Rules](#design-rules)
  * [bar-without-axis-min](#bar-without-axis-min): The measure axis of a bar chart or column chart should start with zero.
  * [x-axis-line-fading](#x-axis-line-fading): The value range of the y-axis of the line graph should be set in a reasonable range.


<!-- ****************************** Hard Rules ****************************** -->
## Hard Rules

Hard rules are used to determine whether input data can be drawn using the given chart type. If any of hard rules is not met, the score of the given chart type will be 0, meaning that chart type will not appear in the advisor's recommended chart list.

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

Each chart type has its own minimum set of necessary data fields. For example, to plot a bar chart, there must be at least two fields: a nominal field as a dimension, displayed on the x-axis, and a quantitative field as a measure, displayed on the y-axis. When we provide a dataset that does not meet this criterion, for example, with only two nominal fields, it is obviously impossible to draw a bar chart. This rule verifies that the input dataset meets the minimum set of data fields required for each chart type. The required conditions of the fields for each chart type are from the `dataPres` property in `ckb`, and you can also go to [this link](https://www.yuque.com/antv/ava/cvv8u6fg7i7oqdak) to look through the field requirements for each chart.

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

### no-redundant-field

All fields in the dataset should be assigned to a mapping, with no redundant fields.

| Type | CA Default Weight |
| ---- | ----------------- |
| HARD | 1.0               |

<!-- omit in toc -->
#### Applicable chart types

 All chart types.

<!-- omit in toc -->
#### Rule Details

In empirical-based single-chart recommendation, each field needs to be used by default, otherwise the subset selections of dataset fields brings more than one recommendation result. In the case where each field is to be used by default, a chart type that would waste any field cannot be recommended. For example, if the dataset has three fields and the basic pie chart can only provide at most two visual channels, the pie chart will not be recommended.

<!-- omit in toc -->
#### Resources

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/no-redundant-field.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### purpose-check

Choose chart types that satisfy the purpose, if purpose is defined.

| Type | CA Default Weight |
| ---- | ----------------- |
| HARD | 1.0               |

<!-- omit in toc -->
#### Applicable chart types

 All chart types.

<!-- omit in toc -->
#### Rule Details

Analysis purposes include comparisons, trends, distributions, and more. Each chart type has its own analysis purpose that it can serve. For example, pie chart can look at comparisons and proportion, but not trends. Then when the user specifies that the analysis purpose is trend, the pie chart is obviously not to be considered.

The specific analysis purposes and the analysis purposes that each chart type can serve can be checked in CKB.

<!-- omit in toc -->
#### Resources

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/ckb/src/interface.ts#L34">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> CKB Purposes Def
</a>
<br>

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/ckb/src/base.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> CKB Chart Base
</a>
<br>

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/purpose-check.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

<!-- ****************************** Soft Rules ****************************** -->

## Soft Rules

Soft rules are used to score the given chart type and provide suggestions based on the input data. The higher the score, the corresponding chart type is more suitable for the input data.

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

Recommend column charts for landscape layout and bar charts for portrait layout.

| Type | CA Default Weight |
| ---- | ----------------- |
| SOFT | 0.3               |

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

When there is more vertical space, use the vertical space to put more columns as much as possible. The same goes for horizontal space.

<!-- omit in toc -->
#### Resources

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/landscape-or-portrait.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### limit-series

Avoid too many values in one series.

| Type | CA Default Weight |
| ---- | ----------------- |
| SOFT | 1.0               |


<!-- omit in toc -->
#### Applicable chart types

 All chart types.

<!-- omit in toc -->
#### Rule Details

A series is usually a specific distinguishable dimension of data, such as a product category, and is usually mapped with a visual channel such as color. When a series contains too many values it is not clearly distinguishable to the reader. For example, imagine a bar chart that contains 20 different colors.

<!-- omit in toc -->
#### Resources

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/limit-series.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### line-field-time-ordinal

Data containing time or ordinal fields are suitable for line or area charts.

| Type | CA Default Weight |
| ---- | ----------------- |
| SOFT | 1.0               |

<!-- omit in toc -->
#### Applicable chart types

  line\_chart,
  area\_chart,
  stacked\_area\_chart,
  percent\_stacked\_area\_chart

<!-- omit in toc -->
#### Rule Details

When a dataset has Time or Ordinal fields, the trend usually needs to be analyzed, and a line or area chart fits well with the expectations of most readers.

<!-- omit in toc -->
#### Resources

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/line-field-time-ordinal.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### nominal-enum-combinatorial

When the data contains at least two nominal fields, basic (column, bar) charts or grouped (or stacked) charts are recommended based on the repetition of their values.

| Type | CA Default Weight |
| ---- | ----------------- |
| SOFT | 1.0               |

<!-- omit in toc -->
#### Applicable chart types

  bar\_chart,
  column\_chart,
  grouped\_bar\_chart,
  grouped\_column\_chart,
  stacked\_bar\_chart,
  stacked\_column\_chart

<!-- omit in toc -->
#### Rule Details

When considering bar (or column) charts, we need to decide when to recommend basic bar charts and when to recommend grouped (or stacked) bar charts.

The prerequisite for recommending grouped bar charts is that there are at least two dimensions that form a hierarchy. The upper level of the hierarchy will at least have a duplication of dimension values. The grouped charts are more recommended if this condition is met.

<!-- omit in toc -->
#### Resources

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/nominal-enum-combinatorial.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

### series-qty-limit

Some charts should has at most N values for the series.

| Type | CA Default Weight |
| ---- | ----------------- |
| SOFT | 0.8               |

<!-- omit in toc -->
#### Applicable chart types

  pie\_chart,
  donut\_chart,
  radar\_chart,
  rose\_chart

<!-- omit in toc -->
#### Rule Details

Some charts like pie charts, radar charts, where there will be a dimension as a series, and the number of its dimensional values determines the number of sectors, the number of axes, etc. This number of dimensional values should not be too large, otherwise it will be difficult for the reader to read the chart clearly.

<!-- omit in toc -->
#### Resources

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/series-qty-limit.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

<br><br>
<!-- ============================================================================== -->

<!-- ****************************** Design Rules ****************************** -->
## Design Rules

The design rules are applied to improve the existing chart specs, for example, adjusting axis scale config.

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

### x-axis-line-fading

The value range of the y-axis of the line graph should be set in a reasonable range.

| Type   | CA Default Weight |
| ------ | ----------------- |
| DESIGN | none              |

<!-- omit in toc -->
#### Applicable chart types

  line_chart

<!-- omit in toc -->
#### Rule Details

For line charts, the presentation of the trend is very important. If the overall absolute values are large and the trend of change is small, then the line chart will look very much like a straight line and it is difficult to see the fluctuations. In this case, the value range of the y-axis can be adjusted appropriately (not starting from 0) to make the trend change perceptible to the reader.

<!-- omit in toc -->
#### Resources

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/x-axis-line-fading.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>
