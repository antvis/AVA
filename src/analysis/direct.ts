import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { AnalysisStrategy, LLMConfig } from '../types';

async function summarizeResult(query: string, data: any, llm: LLMConfig): Promise<string> {
  const openai = createOpenAI({
    apiKey: llm.apiKey,
    baseURL: llm.baseURL,
  });

  const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);

  const prompt = `You are a data analysis assistant. Based on the following query and analysis result, provide a clear and concise summary.

User Query: ${query}

Analysis Result:
${dataStr}

IMPORTANT: Detect the language of the user query. You MUST write your summary in the SAME language as the user query. For example, if the query is in Chinese, write the summary in Chinese; if in English, write in English; if in Japanese, write in Japanese. If the query language is ambiguous, default to English.

Provide a natural language summary of the result. If the result is tabular data, you can present it as a markdown table.`;

  const { text } = await generateText({
    model: openai(llm.model) as any,
    maxRetries: llm.maxRetries ?? 3,
    prompt,
  });

  return text;
}

/** Generate and execute one query, then summarize its data. */
export const directAnalysis: AnalysisStrategy = async (query, { engine, llm }) => {
  const sql = await engine.getDSL(query);
  const data = await engine.execute(sql);
  const summary = await summarizeResult(query, data, llm);

  return {
    query,
    data,
    sql,
    text: summary,
  };
};
