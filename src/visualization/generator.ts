/**
 * GPT-Vis visualization generator
 *
 * The model generates a GPT-Vis config. AVA wraps it in standalone HTML.
 */

import { generateText } from 'ai';
import { z } from 'zod';

import { languageModel } from '../util/model';
import { vizInputSchema } from '../contracts';

import type { LLMConfig, ChartType, ChartConfig } from '../types';

/**
 * Wrap a native GPT-Vis config in standalone HTML.
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
 * Generate a config matching the selected GPT-Vis chart schema.
 */
export async function generateVisualizationConfig(
  chartType: ChartType,
  data: unknown,
  query: string,
  llmConfig: LLMConfig,
  signal?: AbortSignal
): Promise<unknown> {
  const chartSchema = vizInputSchema.options.find((schema) => schema.shape.chartType.value === chartType)!;
  const prompt = `你是一个 GPT-Vis 可视化专家。根据图表类型、数据和用户查询，生成对应的 GPT-Vis 配置。

## 任务信息

**图表类型**: ${chartType}

**用户查询**: ${query}

**数据**:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

## 配置规则

输出一个符合以下 JSON Schema 的 JSON 值。
下面的 JSON Schema 来自 AVA 使用的原生图表输入契约，字段形状、主题与展示选项以它为准：

${JSON.stringify(z.toJSONSchema(chartSchema.shape.config, { io: 'input' }))}

## 要求

1. 只使用给定数据，保留数值和单位。数值字段必须是 number，单位可写在标题或标签中
2. 根据数据特征生成合适的标题，不要设置宽高
3. 直接输出 JSON，不要生成 HTML、代码块或说明文字`;

  const { text } = await generateText({
    model: languageModel(llmConfig),
    maxRetries: llmConfig.maxRetries ?? 3,
    abortSignal: signal,
    prompt,
  });

  // Remove possible markdown code block wrappers (LLM may still wrap in ```json ... ```)
  const json = text
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?\s*```$/, '')
    .trim();
  return JSON.parse(json) as unknown;
}
