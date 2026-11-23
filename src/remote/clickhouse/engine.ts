import { createClient } from '@clickhouse/client';

import { ClickHouseSQLDialect } from '../../query/clickhouse-sql';
import { DEFAULT_METRICS, parseProfileOptions } from '../../util/profile';
import { executionResult, inferQuerySchema, limitedQuery, maxRows } from '../../util/result';
import { onAbort, throwIfAborted } from '../../util/abort';

import { profileTables } from './profile';
import { getClickHouseSchema } from './schema';

import type { ClickHouseClient, ClickHouseClientConfigOptions } from '@clickhouse/client';
import type {
  TranslationResult,
  AnalysisEngine,
  ClickHouseSourceOptions,
  DataSourceConfig,
  DataModel,
  ExecutionOptions,
  ExecutionResult,
  Profile,
  ProfileOptions,
  Schema,
  LLMConfig,
} from '../../types';

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
  private client: ClickHouseClient | null = null;
  private database: string | null = null;
  readonly dialect: ClickHouseSQLDialect;

  constructor(llmConfig: LLMConfig) {
    this.dialect = new ClickHouseSQLDialect(llmConfig);
  }

  async load(configs: DataSourceConfig | DataSourceConfig[]): Promise<void> {
    const sources = Array.isArray(configs) ? configs : [configs];
    if (sources.length !== 1) {
      throw new Error(`ClickHouseEngine currently supports exactly one data source, received ${sources.length}`);
    }
    const config = sources[0];
    await this.dispose();
    if (config.type !== 'clickhouse') {
      throw new Error(`ClickHouseEngine only supports 'clickhouse' data sources, got '${config.type}'`);
    }

    const client = createClient(clientConfig(config.options));
    this.client = client;
    this.database = config.options.database;
  }

  async schema(): Promise<Schema> {
    if (!this.client) throw new Error('No data loaded. Please call source() first.');
    return getClickHouseSchema((sql) => this.runQuery(sql), this.database!);
  }

  async profile(schema: Schema, options: ProfileOptions = {}): Promise<Profile> {
    if (!this.client) throw new Error('No data loaded. Please call source() first.');
    return profileTables(
      (sql) => this.runQuery(sql),
      schema,
      parseProfileOptions(options, { metrics: DEFAULT_METRICS })
    );
  }

  async getDSL(query: string, dataModel: DataModel, signal?: AbortSignal): Promise<TranslationResult> {
    if (!this.client) throw new Error('No data loaded. Please call source() first.');
    return signal ? this.dialect.getDSL(query, dataModel, signal) : this.dialect.getDSL(query, dataModel);
  }

  async execute<T = Record<string, unknown>>(
    dsl: string,
    options?: ExecutionOptions,
    signal?: AbortSignal
  ): Promise<ExecutionResult<T>> {
    if (!this.client) throw new Error('No data loaded. Please call source() first.');
    throwIfAborted(signal);
    const query = await this.dialect.validateDSL(dsl);
    throwIfAborted(signal);
    const rows = await this.runQuery<T>(limitedQuery(query, maxRows(options)), signal).catch((error) => {
      throwIfAborted(signal);
      throw error;
    });
    throwIfAborted(signal);
    return executionResult(rows, inferQuerySchema(rows), options);
  }

  async dispose(): Promise<void> {
    this.database = null;
    const client = this.client;
    this.client = null;
    await client?.close();
  }

  private async runQuery<T = Record<string, unknown>>(query: string, signal?: AbortSignal): Promise<T[]> {
    if (!this.client) throw new Error('No data loaded. Please call source() first.');
    // Enforce on each request, including when source options specify readonly: 0.
    // https://clickhouse.com/docs/operations/settings/permissions-for-queries#readonly
    const result = await this.client.query({
      query,
      format: 'JSONEachRow',
      clickhouse_settings: { readonly: '1' },
      ...(signal ? { abort_signal: signal } : {}),
    });
    // The driver's request abort handler is detached once it returns the result set.
    const detach = onAbort(signal, () => result.close());
    try {
      throwIfAborted(signal);
      const rows = await result.json<unknown>();
      return Array.isArray(rows) ? (rows as T[]) : [];
    } finally {
      detach();
    }
  }
}
