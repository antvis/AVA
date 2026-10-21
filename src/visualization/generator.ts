/**
 * GPT-Vis visualization generator
 *
 * Strategy: LLM only generates a GPT-Vis JSON config, then we wrap it
 * into an HTML template locally. This avoids unreliable regex extraction
 * from LLM-generated HTML and ensures the HTML is always well-formed.
 */

import { generateText } from 'ai';

import { languageModel } from '../util/model';

import type { LLMConfig, ChartType, ChartConfig } from '../types';

/**
 * Wrap a GPT-Vis JSON config into a standalone HTML file that can be opened in any browser
 */
export function wrapConfigInHTML(config: ChartConfig): string {
  // JSON is valid JS; escape sequences that could terminate the script block or are line terminators
  const serialized = JSON.stringify(config)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  return `<!DOCTYPE html>
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
      }
    </style>
  </head>
  <body>
    <div id="container"></div>
    <script>
      const gptVis = new GPTVis.GPTVis({
        container: '#container',
      });

      const visConfig = ${serialized};

      gptVis.render(visConfig);
    </script>
  </body>
</html>`;
}

/**
 * Generate a GPT-Vis JSON config for the chart type, data, and user query.
 */
export async function generateVisualizationConfig(
  chartType: ChartType,
  data: any,
  query: string,
  llmConfig: LLMConfig
): Promise<ChartConfig> {
  const prompt = `你是一个 GPT-Vis 可视化专家。根据图表类型、数据和用户查询，生成对应的 GPT-Vis JSON 配置。

## 任务信息

**图表类型**: ${chartType}

**用户查询**: ${query}

**数据**:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

## JSON 配置规则

输出一个 JSON 对象，\`type\` 字段为图表类型，其余字段见下方各图表类型。所有图表均支持通用属性：\`title\`、\`theme\`（default/light/dark/academy）、\`style\`（\`backgroundColor\`、\`palette\` 色板数组）。数值字段必须是 number，不要带单位或百分号。

## 图表类型配置

- line / area：\`{ "type": "line", "data": [{ "time": "2020", "value": 100, "group": "可选" }], "axisXTitle", "axisYTitle", "stack"（仅 area）}\`
- column / bar：\`{ "type": "column", "data": [{ "category": "Jan", "value": 820, "group": "可选" }], "axisXTitle", "axisYTitle", "stack", "group" }\`
- pie：\`{ "type": "pie", "data": [{ "category": "Android", "value": 72 }], "innerRadius": 0.6 }\`。value 不可使用百分比字符串；\`innerRadius\` 设为 0.6 变为环图。
- scatter：\`{ "type": "scatter", "data": [{ "x": 161.2, "y": 51.6, "group": "可选" }], "axisXTitle", "axisYTitle" }\`
- dual-axes：\`{ "type": "dual-axes", "categories": ["Jan", "Feb"], "series": [{ "type": "column", "axisYTitle": "Sales", "data": [820, 650] }, { "type": "line", "axisYTitle": "Profit (%)", "data": [12, 10] }], "axisXTitle" }\`。series 的 type 只能是 column 或 line，data 与 categories 一一对应。
- histogram：\`{ "type": "histogram", "data": [68, 72, 85], "binNumber": 10, "axisXTitle", "axisYTitle" }\`。data 是原始数值数组。
- boxplot / violin：\`{ "type": "boxplot", "data": [{ "category": "Math", "value": 72 }], "axisXTitle", "axisYTitle" }\`。同一 category 需多条数据以展示分布。
- radar：\`{ "type": "radar", "data": [{ "name": "Performance", "value": 85, "group": "可选" }], "align": false }\`。\`align\` 为 true 时各维度共享比例尺。
- funnel：\`{ "type": "funnel", "data": [{ "category": "Browse", "value": 100 }] }\`，按阶段顺序排列。
- waterfall：\`{ "type": "waterfall", "data": [{ "category": "Q1", "value": 120 }, { "category": "Total", "isTotal": true }], "axisXTitle", "axisYTitle" }\`。value 可为负数表示减少。
- liquid：\`{ "type": "liquid", "percent": 0.72, "shape": "circle" }\`。没有 data；\`percent\` 范围 0~1；\`shape\` 可选 rect/circle/pin/triangle。
- word-cloud：\`{ "type": "word-cloud", "data": [{ "text": "NLP", "value": 88 }] }\`
- venn：\`{ "type": "venn", "data": [{ "sets": ["A"], "value": 3500, "label": "Phone" }, { "sets": ["A", "B"], "value": 1500 }] }\`。交集的 sets 写成多个集合标识。
- treemap：\`{ "type": "treemap", "data": [{ "name": "Software", "value": 2800, "children": [{ "name": "Microsoft", "value": 1200 }] }] }\`
- sankey：\`{ "type": "sankey", "data": [{ "source": "Coal", "target": "Electricity", "value": 320 }], "nodeAlign": "justify" }\`
- table：\`{ "type": "table", "data": [{ "Product": "Smartphone", "Region": "East China", "Sales Amount": 4580 }] }\`，每行一个对象，键为原始列名。

## 要求

1. 只生成一个 JSON 对象，不要生成 HTML 或任何其他代码
2. \`type\` 必须是 ${chartType}
3. 数据字段映射必须正确，字段名必须与上述规范一致
4. 根据数据特征生成合适的标题，单位写在标题或坐标轴标题中
5. 不要生成 width height，图表会按照容器自适应大小
6. 直接输出 JSON，不要用代码块包裹，不要有任何说明文字`;

  const { text } = await generateText({
    model: languageModel(llmConfig),
    maxRetries: llmConfig.maxRetries ?? 3,
    prompt,
  });

  // Remove possible markdown code block wrappers (LLM may still wrap in ```json ... ```)
  const json = text
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?\s*```$/, '')
    .trim();
  const config = JSON.parse(json) as unknown;

  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    throw new Error('Generated GPT-Vis config must be a JSON object.');
  }

  return { ...(config as ChartConfig), type: chartType };
}
