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
import { BigQueryQueryDialect, limitedBigQuerySql, validateReadOnlyBigQuery } from '../../query/bigquery';
import { DEFAULT_METRICS, parseProfileOptions } from '../../util/profile';
import { executionResult, inferQuerySchema, maxRows } from '../../util/result';

import { createConnector } from './connector';
import { profileTables } from './profile';
import { getBigQuerySchema } from './schema';

import type { QueryConnector } from './connector';
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
  readonly language = {
    name: 'Google BigQuery SQL dialect (GoogleSQL)',
    fence: 'sql',
  };

  private connector: QueryConnector | null = null;
  private dataset: string | null = null;
  private readonly queryDialect: BigQueryQueryDialect;
  private projectId = '';

  constructor(llmConfig: LLMConfig) {
    this.queryDialect = new BigQueryQueryDialect(llmConfig);
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
    return getBigQuerySchema((sql) => this.runQuery(sql), this.dataset, this.projectId);
  }

  async profile(schema: Schema, options: ProfileOptions = {}): Promise<Profile> {
    if (!this.connector) throw new Error('No data loaded. Please call source() first.');
    const parsed = parseProfileOptions(options, { metrics: DEFAULT_METRICS });
    // The mock connector profiles its seeded rows directly instead of running
    // production SQL it cannot fully evaluate.
    if (this.connector.profile) return this.connector.profile(schema, parsed);
    return profileTables((sql) => this.runQuery(sql), schema, parsed);
  }

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    if (!this.connector) throw new Error('No data loaded. Please call source() first.');
    return this.queryDialect.getDSL(query, dataModel);
  }

  async execute<T = Record<string, unknown>>(dsl: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    if (!this.connector) throw new Error('No data loaded. Please call source() first.');
    const query = validateReadOnlyBigQuery(dsl);
    const rows = await this.runQuery<T>(limitedBigQuerySql(query, maxRows(options)));
    return executionResult(rows, inferQuerySchema(rows), options);
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

  private async runQuery<T = Record<string, unknown>>(query: string): Promise<T[]> {
    if (!this.connector) throw new Error('No data loaded. Please call source() first.');
    const result = await this.connector.query(query);
    return result.rows as T[];
  }
}

export { validateReadOnlyBigQuery };