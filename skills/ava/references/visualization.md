# 可视化

使用用户提供的数据或查询结果的 `data` 构造图表，所有引擎共用同一条制图路径。

## 选择图表与字段

按用户意图选择类型，将实际字段映射为下表要求的字段。除特殊说明外，字段均位于 `data` 数组的每一项中，`value`、`x`、`y` 使用数值。

| 用途 | `chartType` | 数据字段或结构 |
| --- | --- | --- |
| 类别比较 | `column`, `bar` | `category`, `value`；长标签优先 bar |
| 时间趋势 | `line`, `area` | `time`, `value`；`stack` 仅 area 支持 |
| 部分占整体 | `pie` | `category`, `value`；类别较少且数值非负，`innerRadius 0.6` 为环图 |
| 两个数值变量的关系 | `scatter` | `x`, `y` |
| 数值分布 | `histogram` | 原始观测的数值数组 |
| 分组分布 | `boxplot`, `violin` | `category`, `value`；每类多个观测 |
| 多维指标比较 | `radar` | `name`, `value` |
| 阶段转化 | `funnel` | 按阶段顺序排列的 `category`, `value` |
| 累计增减 | `waterfall` | `category`, `value`；总计项用 `category` 和 `isTotal true` |
| 单个进度 | `liquid` | 顶层 `percent`，范围 0–1，无 `data` 数组 |
| 词频 | `word-cloud` | `text`, `value` |
| 集合交集 | `venn` | `sets`, `value`；交集写作 `sets A,B` |
| 层级组成 | `treemap` | `name`, `value`，可嵌套 `children` 数组 |
| 流向 | `sankey` | `source`, `target`, `value` |
| 精确查值 | `table` | 原始行字段 |
| 不同量级的序列 | `dual-axes` | 顶层 `categories`、`series` 数组；每个 series 含 `type`（column/line）、`axisYTitle`、与 categories 对齐的数值 `data` |

## 构造 Spec

Spec 仅含两个字符串：`chartType` 为图表类型，`syntax` 为 GPT-Vis 语法文本。

- 首行是 `vis <chartType>`，与 Spec 的类型一致。
- 属性写作 `key value`，不用冒号；嵌套缩进两空格，数组项以 `- ` 开头。
- 数据写在标题和轴属性之前；数值用纯数字，单位放在标题或轴标题中。
- 含空格的字段名或字符串加引号。图表尺寸由容器自适应，无需设置 `width`、`height`。

例如地区总额数据 `[{"region":"East","total":25},{"region":"West","total":20}]`，映射 `region → category`、`total → value`，保存为 `chart.json`：

```json
{
  "chartType": "column",
  "syntax": "vis column\ndata\n  - category East\n    value 25\n  - category West\n    value 20\ntitle \"Total by region\"\naxisXTitle Region\naxisYTitle Total"
}
```

用 JSON 序列化器处理 `syntax` 中的换行、引号和反斜杠。

## 渲染与检查

```sh
ava viz --spec @chart.json --output chart.html
```

返回的 `output` 为 HTML 绝对路径，已有文件不会被覆盖。打开 HTML 时需联网加载 GPT-Vis。

CLI 只校验 Spec 结构和图表类型，不验证语法能否正确渲染。有浏览器时预览图形，并核对字段映射、顺序、标题、单位和数据范围；未预览时明确说明。Top N 或汇总后的类别应在图中标明。

渲染失败时根据报错修正，最多两次；仍失败则交付结果表并说明原因。
