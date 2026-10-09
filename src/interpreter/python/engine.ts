/** Python engine: pandas analysis through a local or caller-supplied executor. */

import { generateText } from 'ai';
import { z } from 'zod';

import { languageModel } from '../../util/model';
import { stringifyProfile, stringifySchema } from '../../util/context';
import { executionResult, maxRows, maxResultBytes } from '../../util/result';
import { DEFAULT_METRICS, parseProfileOptions } from '../../util/profile';
import { runWithTimeout } from '../../util/timeout';

import { SCHEMA_CODE, sourceSchema, tableSchema, profileSchema, resultSchema } from './util/schema';
import { profileCode } from './profile';
import { createPythonExecutor } from './util/execute';
import { executionCode } from './util/code';

import type {
  AnalysisEngine,
  DataContext,
  DataSourceConfig,
  ExecutionOptions,
  ExecutionResult,
  LLMConfig,
  Profile,
  ProfileOptions,
  PythonInterpreterEngineOptions,
  Schema,
} from '../../types';

const DEFAULT_QUERY_TIMEOUT_MS = 30_000;

export class PythonInterpreterEngine implements AnalysisEngine {
  readonly language = {
    name: 'Python (pandas)',
    fence: 'python',
    instructions: `pandas is available as pd. Input DataFrames are in tables, keyed by schema table name.
CSV/JSON use tables['data']; Excel exposes every sheet as tables['SheetName'].
For a single table, the DataFrame df is also available. For multiple sheets use tables explicitly.
Assign the final output to result: a DataFrame, Series, list of records, record, or JSON scalar.
DataFrame and Series indexes are not returned; use reset_index() when index values matter.
Each execution starts from fresh input data; variables and mutations do not persist between calls.
Do not read files, access the network, install packages, or print the answer.`,
  };

  private source: DataSourceConfig | null = null;
  private schema: Schema | null = null;
  private readonly timeoutMs: number;
  private readonly executor: ReturnType<typeof createPythonExecutor>;

  constructor(private readonly llmConfig: LLMConfig, engineOptions: PythonInterpreterEngineOptions = {}) {
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
  }

  async load(config: DataSourceConfig): Promise<Schema> {
    this.source = null;
    this.schema = null;

    try {
      this.source = sourceSchema.parse(config) as DataSourceConfig;
      const tables = z.array(tableSchema).parse(await this.metadata(SCHEMA_CODE));

      if (new Set(tables.map((table) => table.name)).size !== tables.length) {
        throw new Error('Python source returned duplicate table names');
      }

      this.schema = { tables } as Schema;

      return this.schema;
    } catch (error) {
      this.source = null;
      throw error;
    }
  }

  async getDSL(query: string, context?: DataContext): Promise<string> {
    if (!this.schema) throw new Error('No data loaded. Please call source() first.');

    const dataset = context?.profile
      ? stringifyProfile(context.profile)
      : stringifySchema(context?.schema ?? this.schema);

    const response = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt: `You are a data analysis expert. Generate Python code to answer the question.
${this.language.instructions}

Dataset information:
${dataset}

User question: ${query}

Return ONLY executable Python code without explanation.`,
    });

    this.llmConfig.onQueryUsage?.(response.usage);

    return response.text
      .trim()
      .replace(/^```(?:python|py)?\s*|\s*```$/gi, '')
      .trim();
  }

  async profile(options: ProfileOptions = {}): Promise<Profile> {
    if (!this.schema) throw new Error('No data loaded. Please call source() first.');

    const tables = profileSchema.parse(
      await this.metadata(profileCode(parseProfileOptions(options, { metrics: DEFAULT_METRICS })))
    );

    return { tables, generatedAt: Date.now() } as unknown as Profile;
  }

  async execute<T = Record<string, unknown>>(code: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    if (!this.source) throw new Error('No data loaded. Please call source() first.');

    const limits = {
      maxRows: z.number().int().positive().parse(maxRows(options)),
      maxResultBytes: maxResultBytes(options),
    };

    // Bound client waiting; the executor must terminate remote work on timeout.
    const maxBuffer = limits.maxResultBytes + 1024 * 1024;
    const response = await runWithTimeout(
      this.executor(executionCode(code, this.source, limits), maxBuffer),
      this.timeoutMs,
      {
        onTimeout: () => new Error(`Python execution timed out after ${this.timeoutMs}ms`),
      }
    );
    const result = resultSchema.parse(response) as ExecutionResult<T>;
    return executionResult(result.data, result.schema, limits, result.truncatedBy);
  }

  private async metadata(code: string): Promise<Record<string, unknown>[]> {
    const result = await this.execute(code, { maxRows: 10_000 });

    if (result.truncated) throw new Error('Python metadata exceeds result limits');

    return result.data;
  }

  async dispose(): Promise<void> {
    // Each executor call owns its execution resources; the engine owns only source metadata.
    this.source = null;
    this.schema = null;
  }
}
