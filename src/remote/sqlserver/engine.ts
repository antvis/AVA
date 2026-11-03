import { ConnectionPool } from 'mssql';

import { SQLServerQueryDialect, SQLSERVER_LANGUAGE_INSTRUCTIONS } from '../../query/sqlserver';
import { DEFAULT_METRICS, parseProfileOptions } from '../../util/profile';
import { executionResult, maxRows } from '../../util/result';

import { profileTables } from './profile';
import { getSQLServerSchema } from './schema';

import type { config as SQLConfig, IColumnMetadata, IResult, Request } from 'mssql';
import type {
  AnalysisEngine,
  DataModel,
  DataSourceConfig,
  ExecutionOptions,
  ExecutionResult,
  LLMConfig,
  Profile,
  ProfileOptions,
  QueryColumn,
  Schema,
  SQLServerSourceOptions,
  TranslationResult,
} from '../../types';

function connectionConfig(options: SQLServerSourceOptions): SQLConfig {
  return {
    server: options.host,
    port: options.port ?? 1433,
    database: options.database,
    user: options.user,
    password: options.password,
    connectionTimeout: options.connectionTimeoutMs ?? 10000,
    requestTimeout: options.requestTimeoutMs ?? 30000,
    options: {
      encrypt: options.encrypt ?? true,
      trustServerCertificate: options.trustServerCertificate ?? false,
    },
  };
}

/** Describe even zero-row results using TDS column metadata. */
function queryColumns(columns: IColumnMetadata[string][]): QueryColumn[] {
  return columns.map((column) => {
    const type = column.type as unknown as { declaration: string };
    return { name: column.name, type: type.declaration };
  });
}

/** SQL Server executes native T-SQL remotely; no rows are imported into DuckDB. */
export class SQLServerEngine implements AnalysisEngine {
  readonly language = {
    name: 'Microsoft SQL Server T-SQL',
    fence: 'sql',
    instructions: SQLSERVER_LANGUAGE_INSTRUCTIONS,
  };

  private pool: ConnectionPool | null = null;
  private sourceSchema: string | undefined;
  private readonly requests = new Set<Request>();
  private readonly queryDialect: SQLServerQueryDialect;

  constructor(llmConfig: LLMConfig) {
    this.queryDialect = new SQLServerQueryDialect(llmConfig);
  }

  async load(config: DataSourceConfig): Promise<void> {
    await this.dispose();
    if (config.type !== 'sqlserver') {
      throw new Error(`SQLServerEngine only supports 'sqlserver' data sources, got '${config.type}'`);
    }
    this.pool = new ConnectionPool(connectionConfig(config.options));
    // Request promises report transport errors. A pool-level listener also prevents
    // idle-connection errors from becoming unhandled EventEmitter exceptions.
    this.pool.on('error', () => undefined);
    try {
      await this.pool.connect();
      this.sourceSchema = config.options.schema;
    } catch (error) {
      await this.dispose();
      throw error;
    }
  }

  async schema(): Promise<Schema> {
    if (!this.pool) throw new Error('No data loaded. Please call source() first.');
    return getSQLServerSchema(async (query) => (await this.runQuery(query)).recordset, this.sourceSchema);
  }

  async profile(schema: Schema, options: ProfileOptions = {}): Promise<Profile> {
    if (!this.pool) throw new Error('No data loaded. Please call source() first.');
    return profileTables(
      async (query) => (await this.runQuery(query)).recordset,
      schema,
      parseProfileOptions(options, { metrics: DEFAULT_METRICS })
    );
  }

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    if (!this.pool) throw new Error('No data loaded. Please call source() first.');
    return this.queryDialect.getDSL(query, dataModel);
  }

  async execute<T = Record<string, unknown>>(dsl: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    if (!this.pool) throw new Error('No data loaded. Please call source() first.');
    const query = await this.queryDialect.validateDSL(dsl);
    // query() uses sp_executesql, which restores SET options on return.
    const result = await this.runQuery<T>(`SET ROWCOUNT ${maxRows(options) + 1};\n${query}`);
    const schema = queryColumns(Object.values(result.recordset.columns));
    return executionResult(result.recordset, schema, options);
  }

  async dispose(): Promise<void> {
    const pool = this.pool;
    this.pool = null;
    this.sourceSchema = undefined;
    try {
      for (const request of this.requests) request.cancel();
    } finally {
      this.requests.clear();
      await pool?.close();
    }
  }

  private async runQuery<T = Record<string, unknown>>(query: string): Promise<IResult<T>> {
    if (!this.pool) throw new Error('No data loaded. Please call source() first.');
    const request = this.pool.request();
    this.requests.add(request);
    try {
      return await request.query<T>(query);
    } finally {
      this.requests.delete(request);
    }
  }
}
