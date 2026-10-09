# 图表

## 从结果到 HTML

所有引擎共用这条制图路径。根据用户意图，将已核验的 `data` 数组映射为图表字段；标题、单位和范围须与查询口径一致。

例如结果为 `[{"region":"East","total":25},{"region":"West","total":20}]`，比较地区总额时选 `column`，映射 `region → category`、`total → value`。保存为 `chart.json`：

```json
{
  "chartType": "column",
  "syntax": "vis column\ndata\n  - category East\n    value 25\n  - category West\n    value 20\ntitle \"Total by region\"\naxisXTitle Region\naxisYTitle Total"
}
```

Spec 仅含 `chartType`、`syntax` 两个字符串，类型须与 syntax 首行一致。用 JSON 序列化器处理换行、引号和反斜杠，然后执行：

```sh
ava viz --spec @chart.json --output chart.html
```

返回的 `output` 为绝对路径，已有文件不会被覆盖。HTML 打开时联网加载 GPT-Vis。

## GPT-Vis 语法

- 首行为 `vis <type>`，属性写作 `key value`，嵌套缩进两空格，数组项以 `- ` 开头。
- 数据在标题和轴属性之前；数值使用纯数字，单位放在标题或轴标题。
- 含空格的字符串加引号。标签含换行或引号等特殊内容时，使用简单标签并附原值映射，或交付表格。
- `syntax` 只含 GPT-Vis 语法，尺寸由容器自适应。通用属性为 `title`、`theme`（`default` / `dark` / `academy`）。

以下字段默认指 `data` 数组中的每项，例外单独注明：

| chartType | 数据字段 / 结构 | 用途或选项 |
| --- | --- | --- |
| `column`, `bar` | `category`, 数值 `value` | 类别比较；长标签优先 bar |
| `line`, `area` | `time`, 数值 `value` | 有序趋势；`stack` 仅 area 支持 |
| `pie` | `category`, 数值 `value` | 少量非负部分构成整体；`innerRadius 0.6` 为环图 |
| `scatter` | 数值 `x`, `y` | 同一观测的两个数值变量 |
| `histogram` | 数值数组，如 `data` 下逐行写 `- 10`、`- 15` | 原始观测分布；可设 `binNumber` |
| `boxplot`, `violin` | `category`, 数值 `value` | 每类多个观测的分布 |
| `radar` | `name`, 数值 `value` | 可比较的多维指标；可设 `align` |
| `funnel` | `category`, 数值 `value` | 按顺序排列的阶段 |
| `waterfall` | `category`, 数值 `value`；总计项加 `isTotal true` | 累计增减，负数表示减少 |
| `liquid` | 顶层 `percent` 为 0–1，无 data 数组 | 单个进度；可设 `shape circle` |
| `word-cloud` | `text`, 数值 `value` | 词频 |
| `venn` | `sets`, 数值 `value`，可选 `label` | 集合交集用 `sets A,B` |
| `treemap` | `name`, 数值 `value`，可嵌套 `children` 数组 | 层级组成 |
| `sankey` | `source`, `target`, 数值 `value` | 流向；可设 `nodeAlign justify` |
| `table` | 原始行字段 | 精确查值；带空格的字段名加引号 |
| `dual-axes` | 顶层 `categories`、`series` 数组；series 项含 `type`（column/line）、`axisYTitle`、与 categories 对齐的数值 `data` | 不同量级的序列对比 |

## 验证与交付

核对字段映射、粒度、顺序、单位和范围。类别过多时，使用标明范围的 Top N、合理汇总的 Other 或表格；多系列可拆为多个图表。

CLI 只检查 Spec 结构和图表类型；有浏览器时预览图形、标题和轴。生成 HTML 不等于渲染验证成功，交付时说明实际验证状态。语法错误最多修正两次，仍失败则提供结果表和原因。
