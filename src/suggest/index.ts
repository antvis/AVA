/**
 * Suggest module for generating recommended analysis queries
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { formatDatasetInfo } from '../data';

import type { LLMConfig, DatasetInfo } from '../types';

/**
 * Result of a suggested query
 */
export interface SuggestResult {
  /** The suggested query string */
  query: string;
  /** Score between 0-1 indicating meaningfulness */
  score: number;
  /** Reason for the score */
  reason: string;
}

/**
 * Generate suggested analysis queries based on dataset
 */
export async function generateSuggestions(
  llmConfig: LLMConfig,
  dataInfo: DatasetInfo,
  count: number = 3
): Promise<SuggestResult[]> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const dataInfoStr = formatDatasetInfo(dataInfo);

  const prompt = `You are a data analysis expert. Based on the following dataset information, suggest ${count} most meaningful analysis queries that would provide valuable insights.

${dataInfoStr}

For each suggested query, provide:
1. The query text (a natural language question that can be analyzed)
2. A score between 0 and 1 indicating how meaningful/valuable this analysis would be (1 being most meaningful)
3. A brief reason explaining why this query is valuable

Consider queries that:
- Reveal important patterns or trends
- Answer key business questions
- Identify anomalies or outliers
- Show relationships between variables
- Provide actionable insights

Return ONLY a valid JSON array with ${count} objects, each having "query", "score", and "reason" fields. The array should be sorted by score in descending order.

Example format:
[
  {
    "query": "What is the average revenue by region?",
    "score": 0.95,
    "reason": "Understanding revenue distribution across regions helps identify high-performing areas and potential growth opportunities"
  }
]

Generate the JSON array now:`;

  const { text } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  // Parse the JSON response
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }
    
    const suggestions = JSON.parse(jsonMatch[0]) as SuggestResult[];
    
    // Validate and normalize the results
    return suggestions
      .filter(s => s.query && typeof s.score === 'number' && s.reason)
      .map(s => ({
        query: s.query,
        score: Math.max(0, Math.min(1, s.score)), // Clamp score between 0-1
        reason: s.reason,
      }))
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, count); // Ensure we return exactly count items
  } catch (error) {
    throw new Error(`Failed to parse suggestions: ${error instanceof Error ? error.message : String(error)}`);
  }
}
