// Compile-time regressions: run by test:types, including the expected failures.
import { sourceConfigSchema, chartSpecSchema } from '../../src';
import { charts } from '../fixtures/charts';

import type {
  AVA,
  AnalysisResponse,
  DataSourceConfig,
  ExecutionResult,
  ChartSpec,
  ChartSpecInput,
  VisualizeResponse,
} from '../../src';
import type {
  DataSourceConfig as BrowserSource,
  ExecutionResult as BrowserResult,
  ChartSpecInput as BrowserChartInput,
} from '../../src/index.browser';
import type {
  ClickHouseSourceOptions,
  SnowflakeSourceOptions,
  CSVReadOptions,
  ExcelSourceOptions,
  JSONReadOptions,
  Model,
  PrimaryKey,
  Metric,
  QueryDialect,
  AnalysisEngine,
  PythonEngineOptions,
} from '../../src/types';
import type { ClickHouseClientConfigOptions } from '@clickhouse/client';
import type { ConnectionOptions as SnowflakeConnectionOptions } from 'snowflake-sdk';
import type { GPTVisConfig } from '@antv/gpt-vis';

const csv: CSVReadOptions = { header: true, types: { amount: 'BIGINT' }, nullstr: ['NA'], sample_size: -1 };
const csvByPosition: CSVReadOptions = { types: ['VARCHAR', 'BIGINT'] };
const json: JSONReadOptions = { format: 'newline_delimited', records: 'true', maximum_depth: -1 };
const excel: ExcelSourceOptions = { path: 'book.xlsx', sheets: [{ sheet: 'Sales' }] };
const source: DataSourceConfig = { type: 'csv-file', options: { path: 'sales.csv', options: csv } };
const browser: BrowserSource = source;
// @ts-expect-error Reader booleans must not widen to unknown or any.
const badCSV: CSVReadOptions = { header: 'true' };
// @ts-expect-error JSON layout remains a finite union.
const badJSON: JSONReadOptions = { format: 'csv' };
// @ts-expect-error The source discriminant must select matching options.
const badSource: DataSourceConfig = { type: 'csv', options: { data: [] } };
// @ts-expect-error JSON source rows must remain objects in the public input type.
const badJSONRow: DataSourceConfig = { type: 'json', options: { data: [1] } };
// @ts-expect-error Required connection fields must stay required after inference.
const missingDatabase: DataSourceConfig = { type: 'mysql', options: { host: 'db' } };
const unpinnedSSH: DataSourceConfig = {
  type: 'mysql',
  // @ts-expect-error SSH credentials require a pinned host key.
  options: { host: 'db', database: 'sales', ssh: { host: 'bastion', user: 'reader' } },
};

// Native fields are taken directly from the installed vendor SDK, without an unknown index signature.
export function clickhouseOptions(native: ClickHouseClientConfigOptions): ClickHouseSourceOptions {
  return {
    database: 'sales',
    host: 'localhost',
    http_agent: native.http_agent,
    tls: native.tls,
    log: native.log,
    json: native.json,
    compression: native.compression,
    clickhouse_settings: native.clickhouse_settings,
    tracer: native.tracer,
  };
}
// @ts-expect-error Native options must keep the official client's types.
const badTLS: ClickHouseSourceOptions = { database: 'sales', tls: 'certificate' };
// @ts-expect-error Unknown options must not become an untyped escape hatch.
const unknownNative: ClickHouseSourceOptions = { database: 'sales', unknown_option: true };

const parsed = sourceConfigSchema.parse(source);
if (parsed.type === 'csv-file') {
  const header: boolean | undefined = parsed.options.options?.header;
  const path: string = parsed.options.path;
  // @ts-expect-error A parsed file source is not an inline source.
  const data = parsed.options.data;
  void [header, path, data];
}

interface Row {
  amount: number;
}
const result: ExecutionResult<Row> = {
  schema: [{ name: 'amount', type: 'BIGINT' }],
  data: [{ amount: 10 }],
  rowCount: 1,
};
const amount: number = result.data[0].amount;
const browserResult: BrowserResult<Row> = result;
// @ts-expect-error Generic row fields must not widen to unknown or any.
const badRow: ExecutionResult<Row> = { schema: [], data: [{ amount: '10' }] };
// @ts-expect-error The result schema is required.
const missingSchema: ExecutionResult<Row> = { data: [] };
// @ts-expect-error The result data is required.
const missingData: ExecutionResult<Row> = { schema: [] };
// @ts-expect-error Result limits retain their public literal types.
const badLimit: ExecutionResult<Row> = { schema: [], data: [], truncatedBy: 'other' };
export function analysisResult(analysis: AnalysisResponse<Row>): ExecutionResult<Row> {
  return analysis;
}

void [
  csvByPosition,
  json,
  excel,
  browser,
  badCSV,
  badJSON,
  badSource,
  badJSONRow,
  missingDatabase,
  unpinnedSSH,
  badTLS,
  unknownNative,
  amount,
  browserResult,
  badRow,
  missingSchema,
  missingData,
  badLimit,
];

// Compatibility exports keep compound metadata constraints and executable extension types.

const model: Model = { name: 'sales', tableReference: { table: 'sales' }, primaryKey: ['tenant', 'id'] };
// @ts-expect-error A model must retain exactly one source.
const ambiguousModel: Model = { name: 'sales', refSql: 'SELECT 1', baseObject: 'raw' };
// @ts-expect-error A composite key must remain nonempty.
const emptyKey: PrimaryKey = [];
const metric: Metric<(column: string) => string> = {
  id: 'custom',
  expression: (column) => `SUM(${column})`,
  enable: ({ target }) => target === 'column',
};
const expression: string = metric.expression('amount');
export function engineDialect(engine: AnalysisEngine): QueryDialect {
  return engine.dialect;
}
export function pythonExecutor(options: PythonEngineOptions): PythonEngineOptions['execute'] {
  return options.execute;
}
void [model, ambiguousModel, emptyKey, expression];

export function snowflakeOptions(native: SnowflakeConnectionOptions): SnowflakeSourceOptions {
  return {
    account: 'org-account',
    database: 'sales',
    proxyHost: native.proxyHost,
    proxyPort: native.proxyPort,
    clientSessionKeepAlive: native.clientSessionKeepAlive,
  };
}
// @ts-expect-error Native driver fields retain their official types.
const invalidSnowflakeProxy: SnowflakeSourceOptions = { account: 'org-account', database: 'sales', proxyPort: '8080' };
// @ts-expect-error AVA owns the driver's row representation.
const overriddenRows: SnowflakeSourceOptions = { account: 'org-account', database: 'sales', rowMode: 'array' };
void [invalidSnowflakeProxy, overriddenRows];
void charts;

// Every schema branch must remain assignable to the installed renderer's native config.
export function nativeChartConfig(spec: ChartSpec): GPTVisConfig {
  return spec.config;
}
export function renderedChartSpec(response: VisualizeResponse): ChartSpec {
  const html: string = response.html;
  void html;
  return response;
}

const chartInput: ChartSpecInput = { chartType: 'column', config: { data: [{ category: 'A', value: 1 }] } };
const browserChartInput: BrowserChartInput = chartInput;
export function renderChartInputs(ava: AVA): Promise<string>[] {
  return [ava.viz(chartInput), ava.viz(browserChartInput), ava.viz({ chartType: 'summary', config: '# Sales' })];
}
const normalized = chartSpecSchema.parse(chartInput);
if (normalized.chartType === 'column') {
  const type: 'column' = normalized.config.type;
  void type;
}
// @ts-expect-error Input defaults must not weaken the chart discriminant.
const mismatchedChart: ChartSpecInput = {
  chartType: 'column',
  config: { type: 'line', data: [{ time: 'A', value: 1 }] },
};
void mismatchedChart;
