/** Python engine: pandas analysis through a local or caller-supplied executor. */

import { z } from 'zod';

import { PythonDialect } from '../../query/python';
import { executionResult, maxRows, maxResultBytes } from '../../util/result';
import { DEFAULT_METRICS, parseProfileOptions } from '../../util/profile';
import { profileMetadataSchema } from '../../contracts/profile';
import { runWithTimeout } from '../../util/timeout';

import { SCHEMA_CODE, sourceSchema, tableSchema, resultSchema } from './util/schema';
import { profileCode } from './profile';
import { createPythonExecutor } from './util/execute';
import { executionCode } from './util/code';

import type {
  TranslationResult,
  AnalysisEngine,
  DataModel,
  DataSourceConfig,
  ExecutionOptions,
  ExecutionResult,
  Profile,
  ProfileOptions,
  Schema,
  LLMConfig,
  PythonEngineOptions,
} from '../../types';

const DEFAULT_QUERY_TIMEOUT_MS = 30_000;

export class PythonEngine implements AnalysisEngine {
  readonly dialect: PythonDialect;

  private source: DataSourceConfig | null = null;
  private readonly timeoutMs: number;
  private readonly executor: ReturnType<typeof createPythonExecutor>;

  constructor(llmConfig: LLMConfig, engineOptions: PythonEngineOptions = {}) {
    if (engineOptions.execute !== undefined && typeof engineOptions.execute !== 'function') {
      throw new Error('Python execute must be a function');
    }
    this.timeoutMs = z
      .number()
      .int()
      .positive()
      .max(2_147_483_647)
      .parse(engineOptions.queryTimeoutMs ?? DEFAULT_QUERY_TIMEOUT_MS);
    this.executor = engineOptions.execute ?? createPythonExecutor(this.timeoutMs);
    this.dialect = new PythonDialect(llmConfig, (script) =>
      runWithTimeout(this.executor(script, 64 * 1024), this.timeoutMs, {
        onTimeout: () => new Error(`Python validation timed out after ${this.timeoutMs}ms`),
      })
    );
  }

  async load(config: DataSourceConfig): Promise<void> {
    this.source = null;
    this.source = sourceSchema.parse(config);
  }

  async schema(): Promise<Schema> {
    if (!this.source) throw new Error('No data loaded. Please call source() first.');

    const tables = z.array(tableSchema).parse(await this.metadata(SCHEMA_CODE));
    if (new Set(tables.map((table) => table.name)).size !== tables.length) {
      throw new Error('Python source returned duplicate table names');
    }
    return { models: tables } as Schema;
  }

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    if (!this.source) throw new Error('No data loaded. Please call source() first.');

    return this.dialect.getDSL(query, dataModel);
  }

  async profile(schema: Schema, options: ProfileOptions = {}): Promise<Profile> {
    if (!this.source) throw new Error('No data loaded. Please call source() first.');

    const tables = await this.metadata(profileCode(parseProfileOptions(options, { metrics: DEFAULT_METRICS }), schema));
    return profileMetadataSchema.parse({ models: tables });
  }

  async execute<T = Record<string, unknown>>(code: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    if (!this.source) throw new Error('No data loaded. Please call source() first.');

    const validated = await this.dialect.validateDSL(code);
    const limits = {
      maxRows: z.number().int().positive().parse(maxRows(options)),
      maxResultBytes: maxResultBytes(options),
    };

    // Bound client waiting; the executor must terminate remote work on timeout.
    const maxBuffer = limits.maxResultBytes + 1024 * 1024;
    const response = await runWithTimeout(
      this.executor(executionCode(validated, this.source, limits), maxBuffer),
      this.timeoutMs,
      {
        onTimeout: () => new Error(`Python execution timed out after ${this.timeoutMs}ms`),
      }
    );
    const result = resultSchema.parse(response);
    // Row fields are chosen by the caller's query; the envelope is runtime-validated above.
    return executionResult(result.data as T[], result.schema, limits, result.truncatedBy);
  }

  private async metadata(code: string): Promise<Record<string, unknown>[]> {
    const result = await this.execute(code, { maxRows: 10_000 });

    if (result.truncated) throw new Error('Python metadata exceeds result limits');

    return result.data;
  }

  async dispose(): Promise<void> {
    // Each executor call owns its execution resources; the engine owns only source configuration.
    this.source = null;
  }
}
