// Compile-time regressions: run by test:types, including the expected failures.
import { sourceConfigSchema, chartSpecSchema, queryOutputSchema, analyzeOutputSchema } from '../../src';
import { charts } from '../fixtures/charts';

import type {
  AVA,
  AnalysisResponse,
  DataSourceConfig,
  ExecutionResult,
  ChartSpec,
  ChartSpecInput,
  VisualizeResponse,
  QueryInput as NodeQueryInput,
  QueryOutput as NodeQueryOutput,
  QueryInput,
  QueryOutput,
  AnalyzeInput,
  AnalyzeOutput,
  SchemaInput,
  SchemaOutput,
  ProfileInput,
  ProfileOutput,
  SemanticInput,
  SemanticOutput,
  RecommendInput,
  RecommendOutput,
  VisualizeInput,
  VisualizeOutput,
  VizInput,
  VizOutput,
  TranslateInput,
  TranslateOutput,
  SuggestInput,
  SuggestOutput,
  SourceInput,
} from '../../src';
import type {
  DataSourceConfig as BrowserSource,
  ExecutionResult as BrowserResult,
  ChartSpecInput as BrowserChartInput,
  QueryInput as BrowserQueryInput,
  QueryOutput as BrowserQueryOutput,
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

// The named contracts retain the existing SDK signatures and result generics.
export async function callWithAPIContracts(
  ava: AVA,
  input: {
    source: SourceInput;
    schema: SchemaInput;
    profile: ProfileInput;
    semantic: SemanticInput;
    query: QueryInput;
    analyze: AnalyzeInput;
    recommend: RecommendInput;
    visualize: VisualizeInput;
    viz: VizInput;
    translate: TranslateInput;
    suggest: SuggestInput;
  }
) {
  await ava.source(input.source);
  const schema: SchemaOutput = await ava.schema(input.schema);
  const profile: ProfileOutput = await ava.profile(input.profile);
  const semantic: SemanticOutput = await ava.semantic(input.semantic);
  const query: QueryOutput = await ava.query(input.query.dsl, input.query.options);
  const analyze: AnalyzeOutput = await ava.analyze(input.analyze.query, input.analyze.config);
  const recommend: RecommendOutput = await ava.recommend(input.recommend);
  const visualize: VisualizeOutput = await ava.visualize(input.visualize);
  const viz: VizOutput = await ava.viz(input.viz);
  const translate: TranslateOutput = await ava.translate(input.translate);
  const suggest: SuggestOutput = await ava.suggest(input.suggest);
  return { schema, profile, semantic, query, analyze, recommend, visualize, viz, translate, suggest };
}
export function genericAPIResults(query: QueryOutput<Row>, analyze: AnalyzeOutput<Row>): number[] {
  return [query.data[0].amount, analyze.data[0].amount];
}
// @ts-expect-error Discovery still requires the catalog's columns.
const missingCatalogColumns: SchemaOutput = { models: [{ name: 'data', tableReference: { table: 'data' } }] };
const emptyCatalogKey: SchemaOutput = {
  // @ts-expect-error Inferred catalog keys remain nonempty.
  models: [{ name: 'data', tableReference: { table: 'data' }, columns: [], primaryKey: [] }],
};
// @ts-expect-error Semantic definitions exclude profiling observations.
const semanticMetrics: SemanticOutput = { models: [{ name: 'data', baseObject: 'raw', metrics: {} }] };
// @ts-expect-error Inferred semantic models still require exactly one source.
const ambiguousSemantic: SemanticOutput = { models: [{ name: 'data', baseObject: 'raw', refSql: 'SELECT 1' }] };
// @ts-expect-error Visualizations must include generated HTML.
const missingHTML: VisualizeOutput = { chartType: 'summary', config: '# Sales' };
const missingOutputType: NonNullable<RecommendOutput> = {
  chartType: 'column',
  // @ts-expect-error Normalized chart output retains a required config.type.
  config: { data: [{ category: 'A', value: 1 }] },
};
void [missingCatalogColumns, emptyCatalogKey, semanticMetrics, ambiguousSemantic, missingHTML, missingOutputType];

// @ts-expect-error Schema has no configurable options.
const invalidSchemaOptions: SchemaInput = { unknownOption: true };
// @ts-expect-error Semantic has no configurable options.
const invalidSemanticOptions: SemanticInput = { unknownOption: true };
void [invalidSchemaOptions, invalidSemanticOptions];

const inferredQueryOutput: QueryOutput = queryOutputSchema.parse({ schema: [], data: [1] });
const inferredAnalyzeOutput: AnalyzeOutput = analyzeOutputSchema.parse({
  query: 'Value?',
  text: '',
  schema: [],
  data: [1],
});
void [inferredQueryOutput, inferredAnalyzeOutput];

// Existing SDK callers retain their default object-row types after the public rename.
export function legacySDKOutputs(
  ava: AVA
): [Promise<ExecutionResult>, Promise<AnalysisResponse>, Promise<VisualizeResponse | null>] {
  return [ava.query('SELECT 1'), ava.analyze('Sales'), ava.visualize({ query: 'Sales', data: [] })];
}
export function sharedQueryInputs(input: QueryInput): BrowserQueryInput {
  const node: NodeQueryInput = input;
  return node;
}
export function sharedQueryOutputs(output: QueryOutput<Row>): BrowserQueryOutput<Row> {
  const node: NodeQueryOutput<Row> = output;
  return node;
}
