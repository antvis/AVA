/**
 * Chart type advisor based on data and query
 *
 * The caller (AVA class) is responsible for formatting data metadata into a
 * string via formatDatasetInfo / formatDatasetInfoWithNonArray before calling
 * adviseChartType.
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { allChartTypes, buildAdvisorPrompt } from './vis';

import type { LLMConfig, ChartType } from '../types';

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

  const match = allChartTypes.find(t => t === raw);
  return (match as ChartType) ?? null;
}
