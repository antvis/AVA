/**
 * SQL-related functionality for data analysis
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { LLMConfig } from '../types';

/**
 * Generate SQL query from natural language using LLM
 */
export async function generateSQL(
  llmConfig: LLMConfig,
  schema: string,
  query: string
): Promise<string> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const prompt = `You are a SQL expert. Given the following table schema and user query, generate a SQL query to answer the question.

Table Schema:
${schema}

User Query: ${query}

Generate ONLY the SQL query without any explanation or markdown formatting. The table name is "data".`;

  const { text } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  // Clean up the SQL - remove markdown code blocks if present
  const sql = text.trim().replace(/^```(?:sql)?\s*|\s*```$/gi, '');
  
  return sql.trim();
}
