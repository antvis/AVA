/**
 * GPT-Vis HTML code generator with comprehensive chart examples
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { LLMConfig, ChartType } from '../types';

/**
 * Generate complete HTML code for visualization with GPT-Vis syntax embedded
 * This function combines both syntax generation and HTML generation in a single LLM call
 * Returns both the syntax and HTML for frontend display
 */
export async function generateVisualizationHTML(
  chartType: ChartType,
  data: any,
  query: string,
  llmConfig: LLMConfig
): Promise<{ syntax: string; html: string }> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const prompt = `你是一个 GPT-Vis 可视化专家。根据图表类型、数据和用户查询，生成一个完整的可独立运行的 HTML 文件，其中包含正确的 GPT-Vis 语法。

## 任务信息

**图表类型**: ${chartType}

**用户查询**: ${query}

**数据**:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

## Syntax 语法规则

第一行必须是 \`vis [type]\`（summary 除外，直接以 Markdown 内容开头）。字段名和值之间用空格分隔，**不要用冒号**。属性顺序：先 \`data\`，后 \`title\`/\`axisXTitle\` 等。

**基本属性** — \`key value\`，每行一个：

\`\`\`
title 年度趋势
theme dark
\`\`\`

**对象数组** — \`data\` 下每项用 \`- \` 开头，子字段缩进：

\`\`\`
{  { time: string; value: number; }[] }
→
data
  - time 2020
    value 100
  - time 2021
    value 120
\`\`\`

**纯值数组** — 每项用 \`- \` 开头：

\`\`\`
{  number[] }
→
data
  - 10
  - 20
\`\`\`

**含空格的字符串值** — 用引号（单引号或双引号）包裹；不含空格时可省略引号：

\`\`\`
categories
  - "North America"
  - '东南 亚'
  - 欧洲
\`\`\`

**嵌套对象** — 对象名占一行，子属性缩进：

\`\`\`
{ style?: { backgroundColor?: string; palette?: string[] } }
→
style
  backgroundColor #f0f2f5
  palette
    - #5B8FF9
    - #61DDAA
\`\`\`

**递归树形** — \`children\` 数组用 \`- \` 缩进：

\`\`\`
type TreeData = { name: string; children?: TreeData[] }
{  TreeData }
→
data
  name 根节点
  children
    - name 子节点A
      children
        - name 孙节点
    - name 子节点B
\`\`\`

**图数据** — \`nodes\`/\`edges\` 数组用 \`- \` 缩进：

\`\`\`
{  { nodes: { name: string }[]; edges: { source: string; target: string; name?: string }[] } }
→
data
  nodes
    - name 节点A
    - name 节点B
  edges
    - source 节点A
      target 节点B
      name 关系
\`\`\`

## 图表类型 Syntax 示例

以下各小节标题即为 \`type\` 值。所有图表均支持通用属性：\`title\`、\`theme\`（default/dark/academy）。

### line / area（折线图 / 面积图）
\`\`\`
vis line
data
  - time 2018
    value 201
  - time 2019
    value 221
  - time 2020
    value 307
title "EV Sales Trend"
axisXTitle Year
axisYTitle "Sales (10K)"
\`\`\`
\`stack\` 仅 area 支持。

### column / bar（柱形图 / 条形图）
\`\`\`
vis column
data
  - category Jan
    value 820
  - category Feb
    value 650
  - category Mar
    value 780
title "E-commerce Monthly GMV"
axisXTitle Month
axisYTitle "GMV (100M)"
\`\`\`

### pie（饼图）
\`\`\`
vis pie
data
  - category Android
    value 72
  - category iOS
    value 27
  - category Others
    value 1
title "Mobile OS Market Share"
\`\`\`
value 不可使用百分比数字。\`innerRadius\` 设为 0.6 变为环图。

### scatter（散点图）
\`\`\`
vis scatter
data
  - x 161.2
    y 51.6
  - x 167.5
    y 59
  - x 159.5
    y 49.2
title "Height vs Weight"
axisXTitle "Height (cm)"
axisYTitle "Weight (kg)"
\`\`\`

### dual-axes（双轴图）
\`\`\`
vis dual-axes
categories
  - Jan
  - Feb
  - Mar
series
  - type column
    axisYTitle "Sales (10K)"
    data
      - 820
      - 650
      - 780
  - type line
    axisYTitle "Profit (%)"
    data
      - 12
      - 10
      - 13
title "Monthly Sales & Profit Rate"
axisXTitle Month
\`\`\`

### histogram（直方图）
\`\`\`
vis histogram
data
  - 68
  - 72
  - 85
  - 56
  - 91
  - 74
  - 63
  - 88
binNumber 10
title "Exam Score Distribution"
axisXTitle Score
axisYTitle Count
\`\`\`

### boxplot / violin（箱线图 / 小提琴图）
同一 category 需多条数据以展示分布。
\`\`\`
vis boxplot
data
  - category Math
    value 72
  - category Math
    value 85
  - category Math
    value 68
  - category History
    value 78
  - category History
    value 82
  - category History
    value 75
title "Exam Scores by Subject"
axisXTitle Subject
axisYTitle Score
\`\`\`

### radar（雷达图）
\`\`\`
vis radar
data
  - name Performance
    value 85
  - name Ecosystem
    value 92
  - name "Learning Curve"
    value 78
title "Framework Evaluation"
\`\`\`
\`align\`: 是否对齐各维度比例尺，默认 false。

### funnel（漏斗图）
\`\`\`
vis funnel
data
  - category "Browse Products"
    value 100
  - category "Add to Cart"
    value 45
  - category "Complete Payment"
    value 18
title "E-commerce Conversion Funnel"
\`\`\`

### waterfall（瀑布图）
\`\`\`
vis waterfall
data
  - category Q1
    value 120
  - category Q2
    value 569
  - category Q3
    value 231
  - category Total
    isTotal true
title "Quarterly Revenue Waterfall"
\`\`\`
value 可为负数表示减少。

### liquid（水波图）
\`\`\`
vis liquid
percent 0.72
shape circle
title "Server CPU Usage"
\`\`\`
\`percent\` 范围 0~1。\`shape\` 可选 rect/circle/pin/triangle。

### word-cloud（词云图）
\`\`\`
vis word-cloud
data
  - text "Machine Learning"
    value 100
  - text "Deep Learning"
    value 95
  - text NLP
    value 88
title "AI Technology Keywords"
\`\`\`

### venn（韦恩图）
\`\`\`
vis venn
data
  - sets A
    value 3500
    label Phone
  - sets B
    value 2800
    label Earphones
  - sets A,B
    value 1500
title "User Purchase Overlap"
\`\`\`
交集用逗号分隔集合标识：\`sets: A,B\`。

### treemap（矩阵树图）
\`\`\`
vis treemap
data
  - name Software
    value 2800
    children
      - name Microsoft
        value 1200
      - name Oracle
        value 500
  - name Hardware
    value 2200
    children
      - name Apple
        value 1500
      - name Dell
        value 400
title "Tech Market Cap"
\`\`\`

### sankey（桑基图）
\`\`\`
vis sankey
data
  - source Coal
    target Electricity
    value 320
  - source "Natural Gas"
    target Heating
    value 160
  - source Hydro
    target Electricity
    value 180
nodeAlign justify
title "Energy Flow"
\`\`\`

### table（表格）
\`\`\`
vis table
data
  - Product Smartphone
    Region "East China"
    "Sales Amount" 4580
  - Product Laptop
    Region "South China"
    "Sales Amount" 3200
title "2024 Q1 Sales Report"
\`\`\`

## 要求

1. 根据上述提供的图表类型、数据和用户查询，生成对应的 GPT-Vis 语法
2. 将生成的 GPT-Vis 语法嵌入到一个完整的 HTML 文件中
3. HTML 文件必须包含：
   - 完整的 HTML 结构 (<!DOCTYPE html>, <html>, <head>, <body>)
   - 引入 GPT-Vis 的 UMD 版本：https://unpkg.com/@antv/gpt-vis/dist/umd/index.min.js
   - 使用 GPTVis.GPTVis 类初始化并渲染图表
   - container 参数必须使用 CSS 选择器格式（如 '#container'），不能省略 # 前缀
   - 添加简洁美观的样式
4. GPT-Vis 语法要求：
   - 数据字段映射必须正确，字段名和值之间用空格分隔，**不要用冒号**
   - data 必须在 title 等属性之前
   - 根据数据特征生成合适的标题
   - 确保语法格式完全符合 GPT-Vis 规范
   - 语法不要生成 width height，图表会按照容器自适应大小
5. 只返回 HTML 代码，不要有任何其他说明文字
6. 在 JavaScript 中使用模板字符串时，如果语法中包含反引号(\`)、美元符号($)或反斜杠(\\)，需要用反斜杠转义

## HTML 模板参考

<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Data Visualization</title>
    <script src="https://unpkg.com/@antv/gpt-vis/dist/umd/index.min.js"></script>
    <style>
      html, body, #container {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        width: 100%;
        height: 100%;
        display: block;
      }
    </style>
  </head>
  <body>
    <div id="container"></div>
    <script>
      const gptVis = new GPTVis.GPTVis({
        container: '#container',
      });

      const visSyntax = \`[这里放入根据数据生成的正确 GPT-Vis 语法]\`;

      gptVis.render(visSyntax);
    </script>
  </body>
</html>

请直接返回完整的 HTML 代码。`;

  const { text } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  const html = text.trim();

  // Extract GPT-Vis syntax from the HTML
  // Look for the visSyntax variable assignment in template literal
  const syntaxMatch = html.match(/const visSyntax = `([^`]*)`/);
  let syntax = '';

  if (syntaxMatch && syntaxMatch[1]) {
    syntax = syntaxMatch[1].trim();
  } else {
    // Fallback: try to find content between vis keyword and gptVis.render
    // Using [\s\S] instead of . with s flag for ES5 compatibility
    const fallbackMatch = html.match(/visSyntax\s*=\s*`([\s\S]*?)`[\s\S]*?gptVis\.render/);
    if (fallbackMatch && fallbackMatch[1]) {
      syntax = fallbackMatch[1].trim();
    }
  }

  return { syntax, html };
}
