---
title: AutoChart
order: 1
---

<playground path="auto-chart/demo/basic.jsx"></playground>

## 数据

### data

<description>**optional** _any[]_</description>

包含对象型数据行的数组，如果为空或者不传，可使用 mock panel 配置生成图表。

### fields

<description>**optional** _string[]_</description>

data 为对象数组时，指定用于自动推荐图表所需的字段，默认使用全部。


## 容器

### title

<description>**optional** _string_</description>

容器标题。

### description

<description>**optional** _string_</description>

容器描述。

### width

<description>**optional** _React.CSSProperties['width']_ _default:_ `"100%"`</description>

容器宽度。

### height

<description>**optional** _React.CSSProperties['height']_ _default:_ `"100%"`</description>

容器高度。

### className

<description>**optional** _string_</description>

容器类名。

### language

<description>**optional** _"zh-CN" | "en-US"_ _default:_ `"zh-CN"`</description>

中英文，默认中文。

## 配置项

### purpose

<description>**optional** _Purpose_</description>

指定图表的分析目的，增加图表推荐的准确度，可以为以下这些值：

* Comparison -- 比较
* Trend -- 趋势
* Distribution -- 分布
* Rank -- 排行
* Proportion -- 比例
* Composition -- 组成

### showRanking

<description>**optional** _boolean_ _default:_ `true`</description>

是否显示推进图表排名列表，可切换图表。

### configurable

<description>**optional** _boolean_ _default:_ `true`</description>

是否显示图标配置面板。

### noDataContent

<description>**optional** _React.ReactNode_</description>

自定义数据为空时显示节点。
