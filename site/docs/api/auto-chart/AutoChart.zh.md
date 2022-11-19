---
title: AutoChart
order: 0
redirect_from:
  - /zh/docs/api
---

```sign
AutoChart = (props: Props): <ConfigProvider />
```

`AutoChart` 是 AVA 中的一键智能可视化 React 组件。
它具有用一行代码就实现根据数据自动推荐合适的图表并渲染的能力。




## 参数列表

* **props** * 输入参数
  * _必要参数_
  * `参数类型`: Props 对象

* ***Props*** 参数配置。

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| data | `any[]` | 源数据。 | 自带 mock panel `可选` |
| fields | `string[]` | 推荐使用的数据字段。 | 使用全部  `可选` |
| title | `string` | 容器标题。 | 无 `可选` |
| description |  `string` | 容器描述信息。 | 无  `可选` |
| width | `React.CSSProperties['width']` | 宽度。 | `100%` `可选` |
| height | `React.CSSProperties['width']` | 高度。 | `100%`  `可选` |
| className |  `string` | 容器类名。 | 无  `可选` |
| language |  `"zh-CN" | "en-US"` | 语言。 | `"zh-CN"`  `可选` |
| purpose |  `Purpose` | 指定图表的分析目的。 | 无  `可选` |
| showRanking |  `boolean` | 是否显示推荐图表排名。 | `true`  `可选` |
| noDataContent |  `React.ReactNode` | 自定义数据为空时显示节点。 | 无  `可选` |

* ***Purpose*** 参数配置。

```ts
type PURPOSE_OPTIONS = ["Comparison", "Trend", "Distribution", "Rank", "Proportion", 
  "Composition", "Relation", "Hierarchy", "Flow", "Spatial", "Anomaly", "Value"];
```

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

是否显示推荐图表排名列表，可切换图表。

<!-- ### configurable

<description>**optional** _boolean_ _default:_ `true`</description>

是否显示图表配置面板。 -->

### noDataContent

<description>**optional** _React.ReactNode_</description>

自定义数据为空时显示节点。
