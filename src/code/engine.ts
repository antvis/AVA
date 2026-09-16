/**
 * Code engine: keeps data in memory, LLM generates JavaScript, executed via
 * a simple Function constructor. Works in both Node.js and browser;
 * inline data only.
 * Note: code execution has no sandbox — in production, consider a more
 * robust sandboxing solution.
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { extractMetadata, formatDatasetInfo } from './metadata';
import { stat, STAT_OPS_PROMPT, STAT_OPS_EXAMPLE } from './stat';

import type { AnalysisEngine, DataSource, DatasetInfo, LLMConfig } from '../types';

/**
 * Execute JavaScript code against data, with stat helpers available as `stat`
 */
export async function executeDataCode(data: any[], code: string): Promise<any> {
  try {
    const func = new Function(
      'data',
      'stat',
      `
      ${code}
      return result;
    `
    );

    return func(data, stat);
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

export class CodeEngine implements AnalysisEngine {
  private data: any[] = [];
  private dataInfo: DatasetInfo | null = null;

  constructor(private readonly llmConfig: LLMConfig) {}

  async load(source: DataSource): Promise<DatasetInfo> {
    if (source.kind !== 'inline') {
      throw new Error(
        'The code engine only supports inline data. Use engine: "duckdb" for file/remote sources.'
      );
    }
    this.data = source.data;
    this.dataInfo = extractMetadata(this.data);
    return this.dataInfo;
  }

  async getDSL(query: string): Promise<string> {
    if (!this.dataInfo) {
      throw new Error('No data loaded.');
    }
    return generateDataCode(this.llmConfig, formatDatasetInfo(this.dataInfo), query);
  }

  async execute(code: string): Promise<any> {
    if (!this.dataInfo) {
      throw new Error('No data loaded.');
    }
    return executeDataCode(this.data, code);
  }

  async dispose(): Promise<void> {
    this.data = [];
    this.dataInfo = null;
  }
}
