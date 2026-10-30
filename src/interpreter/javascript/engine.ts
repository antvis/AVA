/**
 * Interpreter engine: LLM generates JavaScript, executed against in-memory data.
 *
 * Unlike the DuckDB engine, this engine keeps data as a plain JS array and
 * executes LLM-generated code directly in a sandbox. It is lightweight and
 * browser-friendly, but only supports csv/json/text sources.
 */

import { generateText } from 'ai';

import { withOperationEvents } from '../../event';
import { languageModel } from '../../util/model';
import { extractDataSchema } from '../../util/schema';
import { stringifyDataModel } from '../../util/data-model';
import { executionResult, inferQuerySchema } from '../../util/result';
import { DEFAULT_METRICS, parseProfileOptions } from '../../util/profile';

import { profileTables } from './profile';
import { executeCode } from './sandbox';
import { loadSource } from './loaders';
import { STAT_OPS_PROMPT, STAT_OPS_EXAMPLE } from './stat';

import type { Operation } from '../../event';
import type {
  Profile,
  ProfileOptions,
  AnalysisEngine,
  DataModel,
  DataSourceConfig,
  LLMConfig,
  Schema,
  ExecutionOptions,
  ExecutionResult,
} from '../../types';

export class JavaScriptEngine implements AnalysisEngine {
  readonly language = {
    name: 'JavaScript',
    fence: 'javascript',
  };

  private data: any[] | null = null;

  constructor(private readonly llmConfig: LLMConfig) {}

  load(config: DataSourceConfig): Operation<void> {
    this.data = null;
    return withOperationEvents(async (events) => {
      if (!['csv', 'json', 'text'].includes(config.type)) {
        throw new Error(`JavaScriptEngine only supports csv/json/text sources, got: ${config.type}`);
      }

      this.data = await loadSource(config as any, this.llmConfig, events);
    });
  }

  async schema(): Promise<Schema> {
    if (!this.data) throw new Error('No data loaded. Please call source() first.');
    return extractDataSchema(this.data);
  }

  /**
   * Return the loaded in-memory rows (null when nothing is loaded).
   * Only the JavaScript interpreter engine keeps data as a plain single-table array,
   * so it is the only engine that can expose it directly.
   */
  getData(): any[] | null {
    return this.data;
  }

  async profile(schema: Schema, options: ProfileOptions = {}): Promise<Profile> {
    if (!this.data) throw new Error('No data loaded. Please call source() first.');
    return profileTables(this.data, schema, parseProfileOptions(options, { metrics: DEFAULT_METRICS }));
  }

  getDSL(query: string, dataModel: DataModel): Operation<string> {
    return withOperationEvents(async (events) => {
      if (!this.data) {
        throw new Error('No data loaded. Please call source() first.');
      }

      const dataset = stringifyDataModel(dataModel);

      const prompt = `You are a data analysis expert. Given the following dataset information and user query, generate JavaScript code to answer the question.

Dataset Information:
${dataset}

User Query: ${query}

${STAT_OPS_PROMPT}

Generate ONLY the JavaScript code without any explanation. Store the final result in a variable named "result".

${STAT_OPS_EXAMPLE}

Now generate the code:`;

      const { text, usage } = await generateText({
        model: languageModel(this.llmConfig),
        maxRetries: this.llmConfig.maxRetries ?? 3,
        prompt,
      });

      events.emit('translateend', { data: { usage } });

      return text
        .trim()
        .replace(/^```(?:javascript|js)?\s*|\s*```$/gi, '')
        .trim();
    });
  }

  async execute<T = Record<string, unknown>>(code: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    if (!this.data) {
      throw new Error('No data loaded. Please call source() first.');
    }

    const result = await executeCode(structuredClone(this.data), code);
    const rows = (Array.isArray(result) ? result : [{ value: result }]) as T[];
    return executionResult(rows, inferQuerySchema(rows), options);
  }

  async dispose(): Promise<void> {
    this.data = null;
  }
}
