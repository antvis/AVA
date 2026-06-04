/**
 * Chart type advisor based on data and query
 *
 * The caller (AVA class) is responsible for formatting data metadata into a
 * string via formatDatasetInfo / formatDatasetInfoWithNonArray before calling
 * adviseChartType.
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { chartDefinitions } from './vis';

import type { LLMConfig, ChartType } from '../types';

const allChartTypes = chartDefinitions.map(d => d.type);
const chartTypeSet = new Set(allChartTypes);
const chartTypeList = [...allChartTypes, 'none'].map(t => `"${t}"`).join(', ');
const chartDescriptions = chartDefinitions
  .map((chart) => {
    const lines = [
      `### ${chart.nameZh} (${chart.type})`,
      `- **功能**: ${chart.features.join('、')}`,
      `- **适用场景**: ${chart.useCases.join('；')}`,
      `- **数据要求**: ${chart.dataRequirements.join('；')}`,
    ];
    if (chart.limitations.length > 0) {
      lines.push(`- **不适用场景**: ${chart.limitations.join('；')}`);
    }
    return lines.join('\n');
  })
  .join('\n\n');

function buildAdvisorPrompt(query: string, dataInfoStr: string): string {
  return `你是一个图表推荐专家。根据用户的查询和数据特征，判断是否需要可视化，如果需要则推荐最合适的图表类型。

## 用户查询
${query}

## 数据特征
${dataInfoStr}

## 图表类型详细说明

${chartDescriptions}

## 推荐规则

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

## 输出格式

只输出一个 chartType 值，不要其他内容，不要引号，不要解释。可选值: ${chartTypeList}
如果用户查询不包含可视化意图，输出 "none"。`;
}

/**
 * Advise appropriate chart type based on user query and pre-formatted data info.
 *
 * @param query - The user's natural language query
 * @param dataInfoStr - Pre-formatted data description string
 * @param llmConfig - LLM configuration
 * @returns Recommended ChartType, or null if no visualization is needed
 */
export async function adviseChartType(
  query: string,
  dataInfoStr: string,
  llmConfig: LLMConfig
): Promise<ChartType | null> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const prompt = buildAdvisorPrompt(query, dataInfoStr);

  const { text } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  const raw = text.trim().replace(/^["']|["']$/g, '').toLowerCase();

  if (!raw || raw === 'none') return null;

  return chartTypeSet.has(raw as ChartType) ? (raw as ChartType) : null;
}
