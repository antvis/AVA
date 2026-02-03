/**
 * Intent detection for visualization
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { LLMConfig } from '../types';

/**
 * Detect if user query has visualization intent
 */
export async function detectVisualizationIntent(
  query: string,
  llmConfig: LLMConfig
): Promise<boolean> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const prompt = `你是一个数据分析助手。判断以下用户查询是否包含可视化意图。

可视化意图的关键词包括但不限于：
- 绘制、画、展示、显示、可视化
- 图表、图、chart、visualization
- 趋势、分布、占比、对比、排名
- 柱状图、折线图、饼图、散点图等具体图表类型

用户查询: ${query}

请直接回答"是"或"否"，不要有其他内容。`;

  const { text } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  const trimmedResponse = text.trim().toLowerCase();
  return trimmedResponse.startsWith('是') || trimmedResponse.startsWith('yes');
}
