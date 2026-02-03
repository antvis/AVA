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
  data: any[],
  query: string,
  llmConfig: LLMConfig
): Promise<{ syntax: string; html: string }> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const prompt = `你是一个 GPT-Vis 可视化专家。根据图表类型、数据和用户查询，直接生成一个完整的可独立运行的 HTML 文件，其中包含正确的 GPT-Vis 语法。

## 任务信息

**图表类型**: ${chartType}

**用户查询**: ${query}

**数据**:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

## GPT-Vis 完整图表示例参考

### 折线图 (line)
\`\`\`
vis line
data
  - time 2020
    value 100
  - time 2021
    value 120
  - time 2022
    value 150
title 年度趋势
axisXTitle 年份
axisYTitle 数值
\`\`\`

### 柱形图 (column)
\`\`\`
vis column
data
  - category A产品
    value 30
  - category B产品
    value 50
  - category C产品
    value 20
title 产品销量对比
axisXTitle 产品
axisYTitle 销量
\`\`\`

### 条形图 (bar)
\`\`\`
vis bar
data
  - category 第一产业
    value 7200
  - category 第二产业
    value 36600
  - category 第三产业
    value 41000
title 产业产值
\`\`\`

### 饼图 (pie)
\`\`\`
vis pie
data
  - category 类别A
    value 30
  - category 类别B
    value 50
  - category 类别C
    value 20
title 占比分析
\`\`\`

### 环图 (pie with innerRadius)
\`\`\`
vis pie
data
  - category 城镇人口
    value 63.89
  - category 乡村人口
    value 36.11
innerRadius 0.6
title 人口分布
\`\`\`

### 面积图 (area)
\`\`\`
vis area
data
  - time 1月
    value 23.895
  - time 2月
    value 23.695
  - time 3月
    value 23.655
title 股票价格变化
axisXTitle 月份
axisYTitle 价格
\`\`\`

### 散点图 (scatter)
\`\`\`
vis scatter
data
  - x 10
    y 15
  - x 20
    y 25
  - x 30
    y 35
title 相关性分析
\`\`\`

### 双轴图 (dual-axes)
\`\`\`
vis dual-axes
categories
  - 2018
  - 2019
  - 2020
  - 2021
  - 2022
title 销售额与利润率
axisXTitle 年份
series
  - type column
    data 91.9 99.1 101.6 114.4 121
    axisYTitle 销售额(亿)
  - type line
    data 0.055 0.06 0.062 0.07 0.075
    axisYTitle 利润率
\`\`\`

### 直方图 (histogram)
\`\`\`
vis histogram
data
  - 78
  - 88
  - 60
  - 100
  - 95
binNumber 5
title 成绩分布
\`\`\`

### 箱线图 (boxplot)
\`\`\`
vis boxplot
data
  - category 班级A
    value 15
  - category 班级A
    value 18
  - category 班级A
    value 22
  - category 班级A
    value 27
  - category 班级A
    value 35
title 成绩分布
\`\`\`

### 雷达图 (radar)
\`\`\`
vis radar
data
  - name 沟通能力
    value 2
  - name 协作能力
    value 3
  - name 领导能力
    value 2
  - name 学习能力
    value 5
  - name 创新能力
    value 6
  - name 技术能力
    value 9
title 能力评估
\`\`\`

### 漏斗图 (funnel)
\`\`\`
vis funnel
data
  - category 访问
    value 1000
  - category 咨询
    value 600
  - category 下单
    value 300
  - category 成交
    value 120
title 销售漏斗
\`\`\`

### 瀑布图 (waterfall)
\`\`\`
vis waterfall
data
  - category 期初利润
    value 100
  - category 销售收入
    value 80
  - category 运营成本
    value -50
  - category 税费
    value -20
  - category 总计
    isTotal true
title 利润变化
\`\`\`

### 水波图 (liquid)
\`\`\`
vis liquid
percent 0.75
title 任务完成度
\`\`\`

### 词云图 (word-cloud)
\`\`\`
vis word-cloud
data
  - text 环境
    value 20
  - text 保护
    value 15
  - text 可持续发展
    value 10
title 关键词
\`\`\`

### 小提琴图 (violin)
\`\`\`
vis violin
data
  - category 班级A
    value 15
  - category 班级A
    value 18
  - category 班级A
    value 22
title 数据分布
\`\`\`

### 韦恩图 (venn)
\`\`\`
vis venn
data
  - sets A
    value 20
    label 集合A
  - sets B
    value 15
    label 集合B
  - sets A,B
    value 5
    label 交集AB
title 集合关系
\`\`\`

### 矩阵树图 (treemap)
\`\`\`
vis treemap
data
  - name A部门
    value 100
    children
      - name A1
        value 40
      - name A2
        value 30
      - name A3
        value 30
title 组织结构
\`\`\`

### 桑基图 (sankey)
\`\`\`
vis sankey
data
  - source 煤炭
    target 发电厂
    value 120
  - source 天然气
    target 发电厂
    value 80
  - source 发电厂
    target 工业
    value 100
  - source 发电厂
    target 居民
    value 60
title 能源流动
\`\`\`

### 表格 (table)
\`\`\`
vis table
data
  - 姓名 张三
    年龄 25
    城市 北京
  - 姓名 李四
    年龄 30
    城市 上海
title 人员信息
\`\`\`

## 要求

1. 根据上述提供的图表类型、数据和用户查询，生成对应的 GPT-Vis 语法
2. 将生成的 GPT-Vis 语法嵌入到一个完整的 HTML 文件中
3. HTML 文件必须包含：
   - 完整的 HTML 结构 (<!DOCTYPE html>, <html>, <head>, <body>)
   - 引入 GPT-Vis 的 UMD 版本：https://unpkg.com/@antv/gpt-vis/dist/umd/index.min.js
   - 设置容器尺寸为 800px × 600px
   - 使用 GPTVis.GPTVis 类初始化并渲染图表
   - 添加简洁美观的样式
4. GPT-Vis 语法要求：
   - 数据字段映射必须正确
   - 根据数据特征生成合适的标题
   - 确保语法格式完全符合 GPT-Vis 规范
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
      body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
      #container { width: 800px; height: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    </style>
  </head>
  <body>
    <div id="container"></div>
    <script>
      const gptVis = new GPTVis.GPTVis({
        container: '#container',
        width: 800,
        height: 600,
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
