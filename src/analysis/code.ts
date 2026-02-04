/**
 * Code execution functionality for data analysis
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { dataOps, STAT_OPS_PROMPT, STAT_OPS_EXAMPLE } from './stat';

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

${STAT_OPS_PROMPT}

Generate ONLY the JavaScript code without any explanation. Store the final result in a variable named "result".

${STAT_OPS_EXAMPLE}

Now generate the code:`;

  const { text } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  // Clean up the code - remove markdown code blocks if present
  const code = text.trim().replace(/^```(?:javascript|js)?\s*|\s*```$/gi, '');
  
  return code.trim();
}
