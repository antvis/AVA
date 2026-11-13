/**
 * Google BigQuery engine: schema discovery and read-only GoogleSQL execution
 * through a query connector. Production uses the `@google-cloud/bigquery`
 * driver; the built-in `mock` adapter reproduces the same contract in memory so
 * unit tests and demos run without a live GCP project.
 *
 * Read-only is enforced twice: every statement passes a local validation (a
 * single SELECT, no writes/DDL/stored procedures) and is executed through a
 * service-account-scoped query job that the caller limits to reader roles.
 */
import { BigQueryQueryDialect, validateReadOnlyBigQuery } from '../../query/bigquery';
import { DEFAULT_METRICS, parseProfileOptions } from '../../util/profile';
import { executionResult, maxResultBytes, maxRows } from '../../util/result';

import { createConnector } from './connector';
import { profileTables } from './profile';
import { getBigQuerySchema } from './schema';

import type { QueryConnector, QueryLimits, QueryResult } from './connector';
import type {
  TranslationResult,
  AnalysisEngine,
  DataModel,
  DataSourceConfig,
  ExecutionOptions,
  ExecutionResult,
  LLMConfig,
  Profile,
  ProfileOptions,
  Schema,
} from '../../types';

export class BigQueryEngine implements AnalysisEngine {
  readonly dialect: BigQueryQueryDialect;

  private connector: QueryConnector | null = null;
  private dataset: string | null = null;
  private projectId = '';

  constructor(llmConfig: LLMConfig) {
    this.dialect = new BigQueryQueryDialect(llmConfig);
  }

  async load(config: DataSourceConfig): Promise<void> {
    await this.dispose();
    if (config.type !== 'bigquery') {
      throw new Error(`BigQueryEngine only supports 'bigquery' data sources, got '${config.type}'`);
    }

    const connector = await createConnector(config.options);
    // Connect eagerly so configuration/credential errors surface at load time
    // instead of on the first schema()/query() call.
    try {
      await connector.connect();
    } catch (error) {
      await connector.close().catch(() => undefined);
      throw error;
    }

    this.connector = connector;
    this.dataset = config.options.dataset ?? null;
    this.projectId = config.options.projectId;
  }

  async schema(): Promise<Schema> {
    if (!this.connector || !this.dataset) {
      throw new Error('No data loaded. Please call source() first or provide a dataset option.');
    }
    return getBigQuerySchema(async (sql) => (await this.runQuery(sql)).rows, this.dataset, this.projectId);
  }

  async profile(schema: Schema, options: ProfileOptions = {}): Promise<Profile> {
    if (!this.connector) throw new Error('No data loaded. Please call source() first.');
    const parsed = parseProfileOptions(options, { metrics: DEFAULT_METRICS });
    // The mock connector profiles its seeded rows directly instead of running
    // production SQL it cannot fully evaluate.
    if (this.connector.profile) return this.connector.profile(schema, parsed);
    return profileTables(async (sql) => (await this.runQuery(sql)).rows, schema, parsed);
  }

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    if (!this.connector) throw new Error('No data loaded. Please call source() first.');
    return this.dialect.getDSL(query, dataModel);
  }

  async execute<T = Record<string, unknown>>(dsl: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    if (!this.connector) throw new Error('No data loaded. Please call source() first.');
    const query = await this.dialect.validateDSL(dsl);
    // Execute the original statement so its top-level ORDER BY keeps its meaning.
    // The connector reads pages only until one of these decoded-output budgets stops it.
    const result = await this.runQuery<T>(query, {
      maxRows: maxRows(options),
      maxResultBytes: maxResultBytes(options),
    });
    return executionResult(result.rows, result.columns, options, result.truncatedBy);
  }

  async dispose(): Promise<void> {
    this.dataset = null;
    this.projectId = '';
    const connector = this.connector;
    this.connector = null;
    if (connector) {
      await connector.close().catch(() => undefined);
    }
  }

  private async runQuery<T = Record<string, unknown>>(
    query: string,
    limits?: QueryLimits
  ): Promise<QueryResult & { rows: T[] }> {
    if (!this.connector) throw new Error('No data loaded. Please call source() first.');
    // Schema and profiling call this without limits: their result pages must be
    // exhausted or the query must fail, never silently return partial metadata.
    return this.connector.query(query, limits) as Promise<QueryResult & { rows: T[] }>;
  }
}

export { validateReadOnlyBigQuery };