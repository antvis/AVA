/**
 * Code execution functionality for data analysis
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { LLMConfig } from '../types';

/**
 * Execute JavaScript code for data analysis
 * Note: This uses a simple Function constructor for code execution.
 * In production, consider using a more robust sandboxing solution.
 */
export async function executeDataCode(
  data: any[],
  code: string
): Promise<any> {
  try {
    // Create a safe execution context with common data operations
    const dataOps = {
      groupBy: (arr: any[], key: string) => {
        return arr.reduce((acc, item) => {
          const group = item[key];
          if (!acc[group]) acc[group] = [];
          acc[group].push(item);
          return acc;
        }, {});
      },
      sum: (arr: any[], key: string) => {
        return arr.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
      },
      avg: (arr: any[], key: string) => {
        const total = arr.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
        return arr.length > 0 ? total / arr.length : 0;
      },
      max: (arr: any[], key: string) => {
        return Math.max(...arr.map(item => Number(item[key]) || 0));
      },
      min: (arr: any[], key: string) => {
        return Math.min(...arr.map(item => Number(item[key]) || 0));
      },
      count: (arr: any[]) => arr.length,
      sortBy: (arr: any[], key: string, order: 'asc' | 'desc' = 'asc') => {
        return [...arr].sort((a, b) => {
          const valA = a[key];
          const valB = b[key];
          const compare = valA > valB ? 1 : valA < valB ? -1 : 0;
          return order === 'asc' ? compare : -compare;
        });
      },
    };
    
    // Execute code with data and helper functions
    const func = new Function('data', 'ops', `
      ${code}
      return result;
    `);
    
    const result = func(data, dataOps);
    
    return result;
  } catch (error) {
    throw new Error(`Failed to execute data code: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate JavaScript code from natural language using LLM
 */
export async function generateDataCode(
  llmConfig: LLMConfig,
  dataInfo: string,
  query: string
): Promise<string> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const prompt = `You are a data analysis expert. Given the following dataset information and user query, generate JavaScript code to answer the question.

Dataset Information:
${dataInfo}

User Query: ${query}

You have access to a "data" array and an "ops" object with helper functions:
- ops.groupBy(arr, key) - Group array by key
- ops.sum(arr, key) - Sum values by key
- ops.avg(arr, key) - Average values by key
- ops.max(arr, key) - Max value by key
- ops.min(arr, key) - Min value by key
- ops.count(arr) - Count items
- ops.sortBy(arr, key, order) - Sort array

Generate ONLY the JavaScript code without any explanation. Store the final result in a variable named "result".

Example:
const grouped = ops.groupBy(data, 'region');
const result = Object.keys(grouped).map(region => ({
  region,
  avgRevenue: ops.avg(grouped[region], 'revenue')
}));

Now generate the code:`;

  const { text } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  // Clean up the code - remove markdown code blocks if present
  const code = text.trim().replace(/^```(?:javascript|js)?\s*|\s*```$/gi, '');
  
  return code.trim();
}
