/**
 * GPT-Vis visualization generator
 *
 * Strategy: LLM only generates a GPT-Vis JSON config, then we wrap it
 * into an HTML template locally. This avoids unreliable regex extraction
 * from LLM-generated HTML and ensures the HTML is always well-formed.
 */

import { generateText } from 'ai';
import { version as gptVisVersion } from '@antv/gpt-vis/package.json';
import { z } from 'zod';

import { languageModel } from '../util/model';
import { chartSpecSchema } from '../contracts';

import type { LLMConfig } from '../config';
import type { ChartType } from '../contracts';
import type { ChartConfig } from './types';

/**
 * Wrap a GPT-Vis JSON config into a standalone HTML file that can be opened in any browser
 */
export function wrapConfigInHTML(config: ChartConfig): string {
  // JSON.parse preserves __proto__ as data; escape script terminators and JS line separators.
  const serialized = JSON.stringify(JSON.stringify(config))
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Data Visualization</title>
    <script src="https://unpkg.com/@antv/gpt-vis@${gptVisVersion}/dist/umd/index.min.js"></script>
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

      const visConfig = JSON.parse(${serialized});

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
): Promise<Record<string, unknown>> {
  const chartSchema = chartSpecSchema.options.find((schema) => schema.shape.chartType.value === chartType)!;
  const prompt = `你是一个 GPT-Vis 可视化专家。根据图表类型、数据和用户查询，生成对应的 GPT-Vis JSON 配置。

## 任务信息

**图表类型**: ${chartType}

**用户查询**: ${query}

**数据**:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

## JSON 配置规则

输出一个 JSON 对象。数值字段必须是 number，不要带单位或百分号；保留原始数值，单位写在标题或坐标轴标题中。
下面的 JSON Schema 来自 AVA 使用的原生图表输入契约，字段形状、主题与展示选项以它为准：

${JSON.stringify(z.toJSONSchema(chartSchema.shape.config, { io: 'input' }))}

## 要求

1. 只生成一个 JSON 对象，不要生成 HTML 或任何其他代码
2. \`type\` 必须是 ${chartType}
3. 数据字段映射必须正确，字段名必须与上述 schema 一致
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

  return { ...(config as Record<string, unknown>), type: chartType };
}
