/**
 * Interpreter engine: LLM generates JavaScript, executed against in-memory data.
 *
 * Unlike the DuckDB engine, this engine keeps data as a plain JS array and
 * executes LLM-generated code directly in a sandbox. It is lightweight and
 * browser-friendly, but only supports csv/json/text sources.
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { extractDataSchema, stringifySchema } from '../util/schema';
import { executionResult, inferQuerySchema, maxRows } from '../util/result';

import { executeCode } from './sandbox';
import { loadSource } from './loaders';
import { STAT_OPS_PROMPT, STAT_OPS_EXAMPLE } from './stat';

import type { AnalysisEngine, DataSourceConfig, LLMConfig, Schema, ExecutionOptions, ExecutionResult } from '../types';

export class InterpreterEngine implements AnalysisEngine {
  private data: any[] | null = null;

  constructor(private readonly llmConfig: LLMConfig) {}

  async load(config: DataSourceConfig): Promise<Schema> {
    if (!['csv', 'json', 'text'].includes(config.type)) {
      throw new Error(`InterpreterEngine only supports csv/json/text sources, got: ${config.type}`);
    }

    this.data = await loadSource(config as any, this.llmConfig);
    return extractDataSchema(this.data);
  }

  /**
   * Return the loaded in-memory rows (null when nothing is loaded).
   * Only the interpreter engine keeps data as a plain single-table array,
   * so it is the only engine that can expose it directly.
   */
  getData(): any[] | null {
    return this.data;
  }

  async getDSL(query: string): Promise<string> {
    if (!this.data) {
      throw new Error('No data loaded. Please call load() first.');
    }

    const schema = stringifySchema(extractDataSchema(this.data));

    const openai = createOpenAI({
      apiKey: this.llmConfig.apiKey,
      baseURL: this.llmConfig.baseURL,
    });

    const prompt = `You are a data analysis expert. Given the following dataset information and user query, generate JavaScript code to answer the question.

Dataset Information:
${schema}

User Query: ${query}

${STAT_OPS_PROMPT}

Generate ONLY the JavaScript code without any explanation. Store the final result in a variable named "result".

${STAT_OPS_EXAMPLE}

Now generate the code:`;

    const { text } = await generateText({
      model: openai(this.llmConfig.model) as any,
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt,
    });

    return text
      .trim()
      .replace(/^```(?:javascript|js)?\s*|\s*```$/gi, '')
      .trim();
  }

  async execute<T = Record<string, unknown>>(code: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    if (!this.data) {
      throw new Error('No data loaded. Please call load() first.');
    }

    const result = executeCode(this.data, code);
    const rows = (Array.isArray(result) ? result : [{ value: result }]) as T[];
    return executionResult(rows, inferQuerySchema(rows), options);
  }

  async dispose(): Promise<void> {
    this.data = null;
  }
}
