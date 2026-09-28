import { createClient } from '@clickhouse/client';

import { ClickHouseQueryDialect } from '../query/clickhouse';
import { DEFAULT_METRICS, parseProfileOptions } from '../util/profile';
import { executionResult, inferQuerySchema, limitedQuery, maxRows } from '../util/result';

import { profileTables } from './profile';
import { getClickHouseSchema } from './schema';

import type { ClickHouseClient, ClickHouseClientConfigOptions } from '@clickhouse/client';
import type {
  AnalysisEngine,
  ClickHouseSourceOptions,
  DataContext,
  DataSourceConfig,
  ExecutionOptions,
  ExecutionResult,
  LLMConfig,
  Profile,
  ProfileOptions,
  Schema,
} from '../types';

function normalizeUrl(hostOrUrl: string, port?: number): string {
  const base = /^[a-z]+:\/\//i.test(hostOrUrl) ? hostOrUrl : `http://${hostOrUrl}`;
  const url = new URL(base);
  if (port !== undefined) url.port = String(port);
  return url.toString();
}

function clientConfig(options: ClickHouseSourceOptions): ClickHouseClientConfigOptions {
  const { host, url, port, user, username, database, ...rest } = options;
  const endpoint = url ?? host;
  if (!endpoint) throw new Error("ClickHouse source options require either 'host' or 'url'");
  return {
    ...rest,
    url: normalizeUrl(String(endpoint), port),
    username: username ?? user,
    password: options.password,
    database,
  };
}

export class ClickHouseEngine implements AnalysisEngine {
  readonly language = {
    name: 'ClickHouse SQL dialect',
    fence: 'sql',
  };

  private schema: Schema | null = null;
  private client: ClickHouseClient | null = null;
  private database: string | null = null;
  private readonly queryDialect: ClickHouseQueryDialect;

  constructor(llmConfig: LLMConfig) {
    this.queryDialect = new ClickHouseQueryDialect(llmConfig);
  }

  async load(config: DataSourceConfig): Promise<Schema> {
    await this.dispose();
    if (config.type !== 'clickhouse') {
      throw new Error(`ClickHouseEngine only supports 'clickhouse' data sources, got '${config.type}'`);
    }

    const client = createClient(clientConfig(config.options));
    this.client = client;
    this.database = config.options.database;
    try {
      this.schema = await getClickHouseSchema((sql) => this.runQuery(sql), this.database);
      return this.schema;
    } catch (error) {
      await this.dispose();
      throw error;
    }
  }

  async profile(options: ProfileOptions = {}): Promise<Profile> {
    if (!this.schema || !this.client) throw new Error('No data loaded. Please call load() first.');
    return profileTables((sql) => this.runQuery(sql), this.schema, parseProfileOptions(options, { metrics: DEFAULT_METRICS }));
  }

  async getDSL(query: string, context?: DataContext): Promise<string> {
    if (!this.schema) throw new Error('No data loaded. Please call load() first.');
    return this.queryDialect.getDSL(query, context ?? { schema: this.schema });
  }

  async execute<T = Record<string, unknown>>(dsl: string, options?: ExecutionOptions): Promise<ExecutionResult<T>> {
    if (!this.client) throw new Error('No data loaded. Please call load() first.');
    await this.queryDialect.validateDSL(dsl);
    const rows = await this.runQuery<T>(limitedQuery(dsl, maxRows(options)));
    return executionResult(rows, inferQuerySchema(rows), options);
  }

  async dispose(): Promise<void> {
    this.schema = null;
    this.database = null;
    const client = this.client;
    this.client = null;
    await client?.close();
  }

  private async runQuery<T = Record<string, unknown>>(query: string): Promise<T[]> {
    if (!this.client) throw new Error('No data loaded. Please call load() first.');
    const result = await this.client.query({ query, format: 'JSONEachRow' });
    const rows = await result.json<unknown>();
    return Array.isArray(rows) ? (rows as T[]) : [];
  }
}
