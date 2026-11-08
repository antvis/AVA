/**
 * Interpreter engine: LLM generates JavaScript, executed against in-memory data.
 *
 * Unlike the DuckDB engine, this engine keeps data as a plain JS array and
 * executes LLM-generated code directly in a sandbox. It is lightweight and
 * browser-friendly, but only supports csv/json/text sources.
 */

import { JavaScriptDialect } from '../../query/javascript';
import { extractDataSchema } from '../../util/schema';
import { executionResult, inferQuerySchema } from '../../util/result';
import { DEFAULT_METRICS, parseProfileOptions } from '../../util/profile';

import { profileTables } from './profile';
import { executeCode } from './sandbox';
import { loadSource } from './loaders';

import type { TranslationResult } from '../../query/types';
import type { Profile, ProfileOptions } from '../../contracts/profile';
import type { AnalysisEngine } from '../../engines';
import type { DataModel } from '../../contracts/data-model';
import type { DataSourceConfig } from '../../contracts/source';
import type { LLMConfig } from '../../config';
import type { Schema } from '../../contracts/schema';
import type { ExecutionOptions, ExecutionResult } from '../../contracts/result';

export class JavaScriptEngine implements AnalysisEngine {
  readonly dialect: JavaScriptDialect;

  private data: any[] | null = null;

  constructor(private readonly llmConfig: LLMConfig) {
    this.dialect = new JavaScriptDialect(llmConfig);
  }

  async load(config: DataSourceConfig): Promise<void> {
    this.data = null;
    if (!['csv', 'json', 'text'].includes(config.type)) {
      throw new Error(`JavaScriptEngine only supports csv/json/text sources, got: ${config.type}`);
    }

    this.data = await loadSource(config as any, this.llmConfig);
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

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    if (!this.data) {
      throw new Error('No data loaded. Please call source() first.');
    }

    return this.dialect.getDSL(query, dataModel);
  }

  async execute<T = Record<string, unknown>>(code: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    if (!this.data) {
      throw new Error('No data loaded. Please call source() first.');
    }

    const validated = await this.dialect.validateDSL(code);
    const result = await executeCode(structuredClone(this.data), validated);
    const rows = (Array.isArray(result) ? result : [{ value: result }]) as T[];
    return executionResult(rows, inferQuerySchema(rows), options);
  }

  async dispose(): Promise<void> {
    this.data = null;
  }
}
