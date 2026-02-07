/**
 * Unified visualization advisor and generator
 * Combines chart type recommendation and HTML generation in a single LLM call
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { extractMetadata, formatDatasetInfo } from '../data';

import type { LLMConfig, ChartType } from '../types';

export interface UnifiedVisualizationResult {
  /** The recommended chart type, null if no visualization intent detected */
  chartType: ChartType | null;
  /** GPT-Vis syntax, undefined if no visualization */
  syntax?: string;
  /** Complete HTML code, undefined if no visualization */
  html?: string;
}

/**
 * Unified function that detects visualization intent, recommends chart type,
 * and generates GPT-Vis HTML in a single LLM call
 */
export async function generateVisualizationWithAdvice(
  query: string,
  data: any[],
  llmConfig: LLMConfig
): Promise<UnifiedVisualizationResult> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  // Use existing metadata extraction functionality
  const metadata = extractMetadata(data);
  const dataInfo = formatDatasetInfo(metadata);

  const prompt = `你是一个 GPT-Vis 可视化专家。根据用户的查询和数据特征，完成以下两个任务：

## 任务 1: 判断是否需要可视化并推荐图表类型

首先判断用户查询是否包含可视化意图，如果有则推荐最合适的图表类型。

### 用户查询
${query}

### 数据特征
${dataInfo}

### 图表类型详细说明

#### 折线图 (line)
- **功能**: 比较、趋势分析
- **适用场景**: 展示数值随时间或有序类别的变化，分析事物随时间变化的趋势
- **数据要求**: 需要一个时间字段或分类字段，以及至少一个数值字段
- **不适用场景**: 变量数值大多情况下为 0

#### 柱形图 (column)
- **功能**: 比较、分布、排名
- **适用场景**: 对分类数据进行数值比较，尤其是当数值比较接近时
- **数据要求**: 需要一个分类变量和一个数值变量
- **不适用场景**: 不能是连续型变量

#### 条形图 (bar)
- **功能**: 比较、分布、排名
- **适用场景**: 分类数据比较，特别适合分类名称较长或分类数量较多的情况
- **数据要求**: 需要一个分类变量和一个数值变量
- **不适用场景**: 不适合显示连续型变量关系，不适合强调趋势

#### 饼图 (pie)
- **功能**: 占比、成分分析
- **适用场景**: 显示组成部分占整体的比例，强调某部分在整体中的占比
- **数据要求**: 需要一个分类字段和一个数值字段，分类应构成一个整体
- **不适用场景**: 
  - 变量相互独立不构成整体
  - 不能表现趋势
  - 数值接近时难以分辨
  - 类别过多（建议不超过 5 个）

#### 面积图 (area)
- **功能**: 比较、趋势分析
- **适用场景**: 体现连续自变量下数据趋势变化，同时观察数据总量变化
- **数据要求**: 需要时间序列或有序数据
- **不适用场景**: 自变量不是顺序性变量

#### 散点图 (scatter)
- **功能**: 相关性分析、分布
- **适用场景**: 发现两个变量之间的关系或趋势，显示数据分布，检测异常值
- **数据要求**: 需要两个数值变量
- **不适用场景**: 只有一个变量，或分类数据

#### 双轴图 (dual-axes)
- **功能**: 多维对比、趋势分析
- **适用场景**: 同时展示两个不同量级的数据
- **数据要求**: 需要多个数值序列

#### 直方图 (histogram)
- **功能**: 分布分析
- **适用场景**: 显示数据分布
- **数据要求**: 连续数值数据

#### 箱线图 (boxplot)
- **功能**: 分布分析、异常检测
- **适用场景**: 显示数据分布和异常值
- **数据要求**: 连续数值数据，可按分类分组

#### 雷达图 (radar)
- **功能**: 多维对比
- **适用场景**: 多维度数据对比
- **数据要求**: 多个维度的数值数据

#### 漏斗图 (funnel)
- **功能**: 流程分析、转化分析
- **适用场景**: 展示流程转化率
- **数据要求**: 有序的分类数据和对应数值

#### 瀑布图 (waterfall)
- **功能**: 增减变化分析
- **适用场景**: 显示累计效应
- **数据要求**: 分类数据和增减数值

#### 水波图 (liquid)
- **功能**: 进度展示、占比
- **适用场景**: 显示百分比或进度
- **数据要求**: 单个百分比数值

#### 词云图 (word-cloud)
- **功能**: 词频分析、热点展示
- **适用场景**: 展示文本词频
- **数据要求**: 文本和对应频次

#### 小提琴图 (violin)
- **功能**: 分布分析
- **适用场景**: 显示数据分布密度
- **数据要求**: 连续数值数据

#### 韦恩图 (venn)
- **功能**: 集合交并关系
- **适用场景**: 显示集合关系
- **数据要求**: 集合及其交集数据

#### 矩阵树图 (treemap)
- **功能**: 层级占比、结构分析
- **适用场景**: 显示层级数据占比
- **数据要求**: 层级结构数据

#### 桑基图 (sankey)
- **功能**: 流向分析
- **适用场景**: 展示流量流向
- **数据要求**: 源、目标、流量数值

#### 表格 (table)
- **功能**: 数据展示、查找
- **适用场景**: 展示详细数据明细
- **数据要求**: 任意结构化数据

### 推荐规则

1. **识别可视化意图**：检查用户查询是否包含可视化关键词（如：绘制、画图、展示图表、可视化、趋势、占比、分布、对比、排名等）
2. **分析数据特征**：
   - 是否包含时间字段？→ 考虑 line 或 area
   - 是否为分类数据比较？→ 考虑 column 或 bar
   - 是否需要展示占比？→ 考虑 pie（类别≤5）
   - 是否有两个数值变量？→ 考虑 scatter
   - 是否有层级结构？→ 考虑 treemap
   - 是否有流向关系？→ 考虑 sankey
3. **匹配场景**：根据用户意图和数据特征，选择最合适的图表类型
4. **考虑限制**：注意各图表的不适用场景，避免错误推荐

## 任务 2: 如果需要可视化，生成完整的 HTML 代码

如果判断需要可视化，则根据推荐的图表类型和数据生成完整的可独立运行的 HTML 文件。

### 实际数据
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

### GPT-Vis 完整图表示例参考

#### 折线图 (line)
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

#### 柱形图 (column)
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

#### 条形图 (bar)
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

#### 饼图 (pie)
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

#### 环图 (pie with innerRadius)
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

#### 面积图 (area)
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

#### 散点图 (scatter)
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

#### 双轴图 (dual-axes)
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

#### 直方图 (histogram)
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

#### 箱线图 (boxplot)
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

#### 雷达图 (radar)
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

#### 漏斗图 (funnel)
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

#### 瀑布图 (waterfall)
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

#### 水波图 (liquid)
\`\`\`
vis liquid
percent 0.75
title 任务完成度
\`\`\`

#### 词云图 (word-cloud)
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

#### 小提琴图 (violin)
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

#### 韦恩图 (venn)
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

#### 矩阵树图 (treemap)
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

#### 桑基图 (sankey)
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

#### 表格 (table)
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

## 输出格式要求

请按照以下 JSON 格式输出结果：

\`\`\`json
{
  "chartType": "图表类型的英文名称，如果不需要可视化则为 null",
  "html": "完整的 HTML 代码（仅在需要可视化时提供）"
}
\`\`\`

### HTML 代码要求（如果需要可视化）

1. HTML 文件必须包含：
   - 完整的 HTML 结构 (<!DOCTYPE html>, <html>, <head>, <body>)
   - 引入 GPT-Vis 的 UMD 版本：https://unpkg.com/@antv/gpt-vis@beta
   - 使用 GPTVis.GPTVis 类初始化并渲染图表
   - 添加简洁美观的样式
2. GPT-Vis 语法要求：
   - 数据字段映射必须正确
   - 根据数据特征生成合适的标题
   - 确保语法格式完全符合 GPT-Vis 规范
   - 语法不要生成 width height，图表会按照容器自适应大小
3. 在 JavaScript 中使用模板字符串时，如果语法中包含反引号(\`)、美元符号($)或反斜杠(\\)，需要用反斜杠转义

### HTML 模板参考

<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Data Visualization</title>
    <script src="https://unpkg.com/@antv/gpt-vis@beta"></script>
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
        container: 'container',
      });
      
      const visSyntax = \`[这里放入根据数据生成的正确 GPT-Vis 语法]\`;
      
      gptVis.render(visSyntax);
    </script>
  </body>
</html>

请确保输出的 JSON 格式正确，不要有多余的文字说明。`;

  const { text } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  // Parse the JSON response
  let result: UnifiedVisualizationResult;
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/) || text.match(/(\{[\s\S]*\})/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;
    const parsed = JSON.parse(jsonText.trim());
    
    if (parsed.chartType === null || parsed.chartType === 'none' || parsed.chartType === 'null') {
      // No visualization intent
      return {
        chartType: null,
      };
    }

    // Validate chart type
    const validChartTypes: ChartType[] = [
      'line', 'column', 'bar', 'pie', 'area', 'scatter', 'dual-axes',
      'histogram', 'boxplot', 'radar', 'funnel', 'waterfall', 'liquid',
      'word-cloud', 'violin', 'venn', 'treemap', 'sankey', 'table', 'summary',
    ];

    const chartType = parsed.chartType?.toLowerCase();
    if (!chartType || !validChartTypes.includes(chartType as ChartType)) {
      return {
        chartType: null,
      };
    }

    const html = parsed.html?.trim() || '';
    
    // Extract GPT-Vis syntax from the HTML
    // Handle escaped backticks and other special characters in template string
    const syntaxMatch = html.match(/const visSyntax = `((?:[^`\\]|\\.)*)`/);
    let syntax = '';
    
    if (syntaxMatch && syntaxMatch[1]) {
      syntax = syntaxMatch[1].trim();
    } else {
      // Fallback: try to find content between vis keyword and gptVis.render
      // Using a more permissive pattern that handles escaped characters
      const fallbackMatch = html.match(/visSyntax\s*=\s*`([\s\S]*?)`[\s\S]*?gptVis\.render/);
      if (fallbackMatch && fallbackMatch[1]) {
        syntax = fallbackMatch[1].trim();
      }
    }

    result = {
      chartType: chartType as ChartType,
      syntax,
      html,
    };
  } catch (error) {
    // If JSON parsing fails, fall back to legacy behavior
    return {
      chartType: null,
    };
  }

  return result;
}
