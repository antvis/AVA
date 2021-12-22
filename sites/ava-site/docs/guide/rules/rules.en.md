---
title: Rules
order: 0
---

`markdown:docs/common/style.md`

<!-- omit in toc -->
## Rules List

* [General Rules](#general-rules)
  * [bar-series-qty](#bar-series-qty)
    * [Applicable chart types](#applicable-chart-types)
    * [Rule Details](#rule-details)
  * [bar-without-axis-min](#bar-without-axis-min)
  * [data-check](#data-check)
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

Bar chart should has proper number of bars or bar groups.

| Type | CA Default Weight |
| ---- | ----------------- |
| SOFT | 0.5               |

#### Applicable chart types

  bar\_chart,
  grouped\_bar\_chart,
  stacked\_bar\_chart,
  percent\_stacked\_bar\_chart,
  column\_chart,
  grouped\_column\_chart,
  stacked\_column\_chart,
  percent\_stacked\_column\_chart

#### Rule Details

$$x^2$$

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/bar-series-qty.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

### bar-without-axis-min

| Type | CA Default Weight |
| ---- | ----------------- |
|      | none (1.0)        |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/bar-without-axis-min.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

### data-check

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/data-check.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

### data-field-qty

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/data-field-qty.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

### diff-pie-sector

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 0.5               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/diff-pie-sector.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

### landscape-or-portrait

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 0.3               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/landscape-or-portrait.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

### limit-series

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/limit-series.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

### line-field-time-ordinal

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/line-field-time-ordinal.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

### no-redundant-field

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |


<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/no-redundant-field.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

### nominal-enum-combinatorial

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |


<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/nominal-enum-combinatorial.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

### purpose-check

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 1.0               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/purpose-check.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

### series-qty-limit

| Type | CA Default Weight |
| ---- | ----------------- |
|      | 0.8               |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/series-qty-limit.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>

### x-axis-line-fading

| Type | CA Default Weight |
| ---- | ----------------- |
|      | none (1.0)        |

<a class="source-code-link" href="https://github.com/antvis/AVA/blob/master/packages/chart-advisor/src/ruler/rules/x-axis-line-fading.ts">
  <img class="icon-in-site" src="https://gw.alipayobjects.com/zos/antfincdn/3HPWNH%24t0/code.svg"> Source Code
</a>
