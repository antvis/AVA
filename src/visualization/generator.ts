/**
 * GPT-Vis syntax and HTML code generator
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { LLMConfig } from '../types';
import type { ChartType } from './types';

/**
 * Get chart-specific examples
 */
function getChartExamples(chartType: ChartType): string {
  const examples: Record<string, string> = {
    line: `vis line
data
  - time 2020
    value 100
  - time 2021
    value 120
  - time 2022
    value 150
title 年度数据趋势`,
    column: `vis column
data
  - category A产品
    value 30
  - category B产品
    value 50
  - category C产品
    value 20
title 产品销量对比`,
    bar: `vis bar
data
  - category 产品类别A
    value 30
  - category 产品类别B
    value 50
title 产品销量`,
    pie: `vis pie
data
  - category 类别A
    value 30
  - category 类别B
    value 50
  - category 类别C
    value 20
title 占比分析`,
    area: `vis area
data
  - time 2020
    value 100
  - time 2021
    value 120
  - time 2022
    value 150
title 趋势分析`,
    scatter: `vis scatter
data
  - x 1
    y 2
  - x 2
    y 4
  - x 3
    y 3
title 散点分布`,
    table: `vis table
data
  - name 张三
    age 25
    city 北京
  - name 李四
    age 30
    city 上海`,
  };

  return examples[chartType] || examples.column;
}

/**
 * Generate GPT-Vis syntax based on chart type and data
 */
export async function generateGPTVisSyntax(
  chartType: ChartType,
  data: any[],
  query: string,
  llmConfig: LLMConfig
): Promise<string> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const chartExamples = getChartExamples(chartType);

  const prompt = `你是一个 GPT-Vis 语法生成专家。根据图表类型和数据，生成标准的 GPT-Vis 语法。

## 图表类型
${chartType}

## 数据
${JSON.stringify(data, null, 2)}

## 用户查询
${query}

## GPT-Vis 语法示例
${chartExamples}

请根据数据生成完整的 GPT-Vis 语法。要求：
1. 使用标准的 GPT-Vis 语法格式
2. 确保数据字段映射正确
3. 可以添加合适的标题
4. 只返回语法内容，不要有其他说明文字

输出格式示例：
vis ${chartType}
data
  - field1 value1
    field2 value2
title 标题
`;

  const { text } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  return text.trim();
}

/**
 * Escape special characters in syntax for safe embedding in template literals
 */
function escapeSyntaxForTemplate(syntax: string): string {
  return syntax
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/`/g, '\\`')     // Escape backticks
    .replace(/\$/g, '\\$');   // Escape dollar signs
}

/**
 * Generate complete HTML code for visualization
 */
export async function generateVisualizationHTML(
  syntax: string,
  llmConfig: LLMConfig
): Promise<string> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const escapedSyntax = escapeSyntaxForTemplate(syntax);

  const prompt = `你是一个前端代码生成专家。根据提供的 GPT-Vis 语法，生成一个完整的可独立运行的 HTML 文件。

## GPT-Vis 语法
\`\`\`
${syntax}
\`\`\`

## 要求
1. 使用 GPT-Vis 的 UMD 版本（CDN: https://unpkg.com/@antv/gpt-vis/dist/umd/index.min.js）
2. 创建一个完整的 HTML 文件，包含 <!DOCTYPE html>、<head> 和 <body>
3. 设置合适的容器尺寸（宽度 800px，高度 600px）
4. 使用 GPTVis.GPTVis 类来渲染图表
5. 添加简单的样式使页面美观
6. 只返回 HTML 代码，不要有其他说明文字

参考模板：
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Data Visualization</title>
    <script src="https://unpkg.com/@antv/gpt-vis/dist/umd/index.min.js"></script>
    <style>
      body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
      #container { width: 800px; height: 600px; margin: 0 auto; }
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
      
      const visSyntax = \`${escapedSyntax}\`;
      
      gptVis.render(visSyntax);
    </script>
  </body>
</html>
`;

  const { text } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  return text.trim();
}
