/** Python engine: pandas analysis through a local or caller-supplied executor. */

import { z } from 'zod';

import { PythonDialect } from '../../query/python';
import { executionResult, maxRows, maxResultBytes } from '../../util/result';
import { DEFAULT_METRICS, parseProfileOptions } from '../../util/profile';
import { profileOutputSchema } from '../../contracts';
import { runWithTimeout } from '../../util/timeout';
import { createAbortError, onAbort, throwIfAborted } from '../../util/abort';

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
  private lifetime = new AbortController();
  private readonly running = new Set<Promise<ExecutionResult>>();
  private readonly timeoutMs: number;
  private readonly executor: ReturnType<typeof createPythonExecutor>;
  private readonly customExecutor: boolean;

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
    this.customExecutor = engineOptions.execute !== undefined;
    this.dialect = new PythonDialect(llmConfig, (script, signal) =>
      this.runScript(script, 64 * 1024, 'validation', this.operationSignal(signal))
    );
  }

  async load(configs: DataSourceConfig | DataSourceConfig[]): Promise<void> {
    const sources = Array.isArray(configs) ? configs : [configs];
    if (sources.length !== 1) {
      throw new Error(`PythonEngine currently supports exactly one data source, received ${sources.length}`);
    }
    const config = sources[0];
    await this.dispose();
    this.lifetime = new AbortController();
    this.source = sourceSchema.parse(config);
  }

  async schema(signal?: AbortSignal): Promise<Schema> {
    if (!this.source) throw new Error('No data loaded. Please call source() first.');

    const tables = z.array(tableSchema).parse(await this.metadata(SCHEMA_CODE, signal));
    if (new Set(tables.map((table) => table.name)).size !== tables.length) {
      throw new Error('Python source returned duplicate table names');
    }
    return { models: tables } as Schema;
  }

  async getDSL(query: string, dataModel: DataModel, signal?: AbortSignal): Promise<TranslationResult> {
    if (!this.source) throw new Error('No data loaded. Please call source() first.');

    return signal ? this.dialect.getDSL(query, dataModel, signal) : this.dialect.getDSL(query, dataModel);
  }

  async profile(schema: Schema, options: ProfileOptions = {}, signal?: AbortSignal): Promise<Profile> {
    if (!this.source) throw new Error('No data loaded. Please call source() first.');

    const script = profileCode(parseProfileOptions(options, { metrics: DEFAULT_METRICS }), schema);
    const tables = await this.metadata(script, signal);
    return profileOutputSchema.parse({ models: tables });
  }

  async execute<T = Record<string, unknown>>(
    code: string,
    options?: ExecutionOptions,
    caller?: AbortSignal
  ): Promise<ExecutionResult<T>> {
    const source = this.source;
    if (!source) throw new Error('No data loaded. Please call source() first.');

    const signal = this.operationSignal(caller);
    throwIfAborted(signal);
    const validated = await this.dialect.validateDSL(code, signal);
    const limits = {
      maxRows: z.number().int().positive().parse(maxRows(options)),
      maxResultBytes: maxResultBytes(options),
    };

    const maxBuffer = limits.maxResultBytes + 1024 * 1024;
    const response = await this.runScript(executionCode(validated, source, limits), maxBuffer, 'execution', signal);
    const result = resultSchema.parse(response);
    // Row fields are chosen by the caller's query; the envelope is runtime-validated above.
    return executionResult(result.data as T[], result.schema, limits, result.truncatedBy);
  }

  private operationSignal(signal?: AbortSignal): AbortSignal {
    return signal ? AbortSignal.any([signal, this.lifetime.signal]) : this.lifetime.signal;
  }

  private async runScript(
    code: string,
    maxBuffer: number,
    stage: 'validation' | 'execution',
    signal: AbortSignal
  ): Promise<ExecutionResult> {
    throwIfAborted(signal);
    const pending = this.customExecutor
      ? this.runCustomScript(code, maxBuffer, stage, signal)
      : this.executor(code, maxBuffer, signal);
    this.running.add(pending);
    try {
      const result = await pending;
      throwIfAborted(signal);
      return result;
    } finally {
      this.running.delete(pending);
    }
  }

  private async runCustomScript(
    code: string,
    maxBuffer: number,
    stage: 'validation' | 'execution',
    signal: AbortSignal
  ): Promise<ExecutionResult> {
    const deadline = new AbortController();
    const combined = AbortSignal.any([signal, deadline.signal]);
    // Stop waiting even if a custom executor does not cooperate with cancellation.
    let detach: (() => void) | undefined;
    const pending = new Promise<ExecutionResult>((resolve, reject) => {
      detach = onAbort(combined, reject);
      this.executor(code, maxBuffer, combined).then(resolve, reject);
    });
    try {
      return await runWithTimeout(pending, this.timeoutMs, {
        onTimeout: () => {
          const error = new Error(`Python ${stage} timed out after ${this.timeoutMs}ms`);
          deadline.abort(error);
          return error;
        },
      });
    } finally {
      detach?.();
    }
  }

  private async metadata(code: string, signal?: AbortSignal): Promise<Record<string, unknown>[]> {
    const result = await this.execute(code, { maxRows: 10_000 }, signal);

    if (result.truncated) throw new Error('Python metadata exceeds result limits');

    return result.data;
  }

  async dispose(): Promise<void> {
    this.source = null;
    this.lifetime.abort(createAbortError('Python source was disposed.'));
    await Promise.allSettled(this.running);
  }
}
