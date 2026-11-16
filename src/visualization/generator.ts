/**
 * GPT-Vis visualization generator
 *
 * The model generates a JSON chart config or T8 text. AVA supplies the HTML.
 */

import { generateText } from 'ai';
import { z } from 'zod';

import { languageModel } from '../util/model';
import { chartSpecSchema } from '../contracts/visualize';

import type { LLMConfig, ChartType, ChartConfig, ChartSpec } from '../types';

/**
 * Wrap a GPT-Vis chart config or T8 string in standalone HTML.
 */
export function wrapConfigInHTML(config: ChartConfig | string): string {
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
    <script src="https://registry.npmmirror.com/@antv/gpt-vis/1.3.1/files/dist/umd/index.min.js"></script>
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
 * Generate a visualization spec for the selected type, data, and query.
 */
export async function generateVisualizationSpec(
  chartType: ChartType,
  data: unknown,
  query: string,
  llmConfig: LLMConfig
): Promise<ChartSpec> {
  const chartSchema = chartSpecSchema.options.find((schema) => schema.shape.chartType.value === chartType)!;
  const rules =
    chartType === 'summary'
      ? `直接输出 T8 文本，可用 Markdown 标题和段落，以及 [120](metric_value, origin=120) 这样的指标标注。
根据数据写简短摘要，保留原始数值和单位，不补造数据或推断原因。不要输出 JSON、HTML、代码块或 vis 图表语法。`
      : `## JSON 配置规则

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

  const prompt = `你是一个 GPT-Vis 可视化专家。根据可视化类型、数据和用户查询，生成对应的内容。

**可视化类型**: ${chartType}
**用户查询**: ${query}
**数据**:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

${rules}`;

  const { text } = await generateText({
    model: languageModel(llmConfig),
    maxRetries: llmConfig.maxRetries ?? 3,
    prompt,
  });

  if (chartType === 'summary') {
    const summary = text.trim().replace(/^```(?:markdown|md|t8)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i, '$1');
    return chartSpecSchema.parse({ chartType, text: summary });
  }

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

  return chartSpecSchema.parse({ chartType, config: { ...config, type: chartType } });
}
