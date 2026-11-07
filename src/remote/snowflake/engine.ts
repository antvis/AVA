/**
 * Snowflake engine: schema discovery and read-only SQL execution through a
 * query connector. Production uses the `snowflake-sdk` driver; the built-in
 * `mock` adapter reproduces the same contract in memory so unit tests and
 * demos run without a live Snowflake account nor network access.
 *
 * Read-only is enforced twice: every statement passes local validation (a
 * single SELECT/WITH without writes, DDL, stages, CALL, sequences, or other
 * side effects). Production connections must also use a restricted read-only
 * role; selecting a database/schema is not a privilege boundary.
 */
import { SnowflakeQueryDialect, limitedSnowflakeQuery, validateReadOnlySnowflake } from '../../query/snowflake';
import { DEFAULT_METRICS, parseProfileOptions } from '../../util/profile';
import { executionResult, inferQuerySchema, maxRows } from '../../util/result';

import { createConnector } from './connector';
import { profileTables } from './profile';
import { getSnowflakeSchema } from './schema';

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

export class SnowflakeEngine implements AnalysisEngine {
  readonly language = {
    name: 'Snowflake SQL dialect',
    fence: 'sql',
  };

  private connector: QueryConnector | null = null;
  private database: string | null = null;
  private schemaName: string | null = null;
  private readonly queryDialect: SnowflakeQueryDialect;

  constructor(llmConfig: LLMConfig) {
    this.queryDialect = new SnowflakeQueryDialect(llmConfig);
  }

  async load(config: DataSourceConfig): Promise<void> {
    await this.dispose();
    if (config.type !== 'snowflake') {
      throw new Error(`SnowflakeEngine only supports 'snowflake' data sources, got '${config.type}'`);
    }

    const connector = await createConnector(config.options);
    // Connect eagerly so configuration errors surface at load time instead of
    // on the first schema()/query() call.
    try {
      await connector.connect();
    } catch (error) {
      await connector.close().catch(() => undefined);
      throw error;
    }

    this.connector = connector;
    this.database = config.options.database;
    this.schemaName = config.options.schema ?? 'PUBLIC';
  }

  async schema(): Promise<Schema> {
    if (!this.connector || !this.database) {
      throw new Error('No data loaded. Please call source() first.');
    }
    return getSnowflakeSchema((sql) => this.runQuery(sql), this.database, this.schemaName!);
  }

  async profile(schema: Schema, options: ProfileOptions = {}): Promise<Profile> {
    if (!this.connector) throw new Error('No data loaded. Please call source() first.');
    return profileTables(
      (sql) => this.runQuery(sql),
      schema,
      parseProfileOptions(options, { metrics: DEFAULT_METRICS })
    );
  }

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    if (!this.connector) throw new Error('No data loaded. Please call source() first.');
    return this.queryDialect.getDSL(query, dataModel);
  }

  async execute<T = Record<string, unknown>>(dsl: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    if (!this.connector) throw new Error('No data loaded. Please call source() first.');
    const query = validateReadOnlySnowflake(dsl);
    const rows = await this.runQuery<T>(limitedSnowflakeQuery(query, maxRows(options)));
    return executionResult(rows, inferQuerySchema(rows), options);
  }

  async dispose(): Promise<void> {
    this.database = null;
    this.schemaName = null;
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

export { validateReadOnlySnowflake };
