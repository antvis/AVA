# GPT-Vis 图表语法

## 从结果到 Spec

以这组查询结果为例：

```json
[{"region":"East","total":25},{"region":"West","total":20}]
```

比较地区总额时选择 `column`，映射 `region → category`、`total → value`。保存为 `chart.json`：

```json
{
  "chartType": "column",
  "syntax": "vis column\ndata\n  - category East\n    value 25\n  - category West\n    value 20\ntitle \"Total by region\"\naxisXTitle Region\naxisYTitle Total"
}
```

执行 `ava viz --spec @chart.json --output chart.html`。Spec 只包含 `chartType` 和 `syntax` 两个字符串，类型必须与 syntax 首行一致。数据和标题保持相同查询口径，例如求和结果标注为总额。

## 语法规则

1. 第一行是 `vis <type>`。每个属性使用空格分隔的 `key value`；嵌套内容缩进两空格，数组项以 `- ` 开头。
2. 数据写在标题和轴属性之前。数值使用纯数字；货币、百分比等单位放在标题或轴标题。
3. 含空格的字符串使用引号。标签含换行、引号等可能破坏语法的内容时，使用简单标签并提供原值映射，或改为回答中的表格。
4. `syntax` 使用纯 GPT-Vis 语法，图表尺寸由容器自适应。外层 JSON 由序列化器处理换行、引号和反斜杠。

通用属性为 `title`、`theme`（`default` / `dark` / `academy`）。下面的字段默认表示 `data` 数组中每项的字段，特殊结构单独注明。

| chartType | 数据字段 / 结构 | 使用条件 |
| --- | --- | --- |
| `column`, `bar` | `category`, 数值 `value` | 类别比较；长标签优先 bar |
| `line`, `area` | `time`, 数值 `value` | 有序时间趋势；`stack` 仅 area 支持 |
| `pie` | `category`, 数值 `value` | 少量非负部分组成整体；`innerRadius 0.6` 可变环图 |
| `scatter` | 数值 `x`, `y` | 同一观测的两个数值变量 |
| `histogram` | 数值数组 | 使用原始观测；可设置 `binNumber` |
| `boxplot`, `violin` | `category`, 数值 `value` | 每个类别需要多个观测 |
| `radar` | `name`, 数值 `value` | 可比较的多维指标；可设置 `align` |
| `funnel` | `category`, 数值 `value` | 有先后顺序的阶段 |
| `waterfall` | `category`, 数值 `value`；总计项为 `isTotal true` | 累计增减，负数表示减少 |
| `liquid` | 顶层 `percent` 为 0–1，无 data 数组 | 单个进度；可设置 `shape circle` |
| `word-cloud` | `text`, 数值 `value` | 词频 |
| `venn` | `sets`, 数值 `value`，可选 `label` | 集合交集用 `sets A,B` |
| `treemap` | `name`, 数值 `value`，可嵌套 `children` 数组 | 层级组成 |
| `sankey` | `source`, `target`, 数值 `value` | 流向；可设置 `nodeAlign justify` |
| `table` | 原始行字段 | 精确查值；带空格的字段名加引号 |
| `dual-axes` | 顶层 `categories` 数组及 `series` 数组 | 不同量级对比；series 项含 `type`（column/line）、`axisYTitle`、与 categories 对齐的数值 `data` 数组 |

数值数组示例：

```text
vis histogram
data
  - 10
  - 15
  - 20
binNumber 3
title "Sales distribution"
```

## 渲染检查

确认字段映射、粒度、顺序和单位正确。类别太多时使用明确标注的 Top N、可合理汇总的 Other 或表格，并明确标注数据范围。多系列需求可按本文件支持的结构拆成多个图表。

CLI 检查 Spec 结构和图表类型；浏览器预览用于核对标题、轴和图形。语法错误最多修正两次，仍失败则提供结果表并说明原因。
