/**
 * AVA v4 - A framework for AI-native Visual Analytics
 */

import { getEngineClass } from './engines';
import { extractDataSchema } from './util/schema';
import { stringifySchema } from './util/context';
import { adviseChartType, generateVisualizationSyntax, wrapSyntaxInHTML } from './visualization';
import { generateSuggestions } from './suggest';
import { analyze } from './analysis';

import type {
  AVAConfig,
  LLMConfig,
  EngineConfig,
  DataSourceConfig,
  Schema,
  AnalysisEngine,
  AnalysisResponse,
  AnalysisConfig,
  VisualizeResponse,
  ChartSpec,
  SuggestResult,
  Profile,
  ProfileOptions,
  ExecutionOptions,
  ExecutionResult,
} from './types';

/**
 * Check if analysis result has meaningful data for visualization.
 * Accepts arrays (non-empty), objects (non-empty), and non-null/non-undefined primitives.
 */
function hasData(data: unknown): boolean {
  if (data == null) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === 'object') return Object.keys(data).length > 0;
  return true;
}

/**
 * Main AVA class for AI-native visual analytics.
 * Data loading and analysis are backed by the DuckDB engine — natural-language
 * queries are turned into SQL via LLM and executed against an in-memory DuckDB.
 */
export class AVA {
  private readonly llmConfig: LLMConfig;
  private readonly engineConfig: EngineConfig;
  engine: AnalysisEngine | null = null;
  private dataSchema: Schema | null = null;
  private dataProfile: Profile | null = null;

  constructor(config: AVAConfig) {
    this.llmConfig = config.llm;
    this.engineConfig = config.engine ?? { type: 'duckdb' };
  }

  /**
   * Instantiate the engine selected by the engine config.
   * Engine classes are registered by the entry point (index.ts /
   * index.browser.ts), so this class never imports any engine implementation
   * directly — Node-only engines stay out of browser bundles.
   */
  private async createEngine(): Promise<AnalysisEngine> {
    const { type, ...options } = this.engineConfig;
    const EngineClass = getEngineClass(type);
    return new EngineClass(this.llmConfig, options);
  }

  /**
   * Load a data source config into the engine.
   * Reloading disposes the previous engine and its resources.
   */
  async source(config: DataSourceConfig): Promise<void> {
    this.dataSchema = null;
    this.dataProfile = null;
    await this.engine?.dispose();
    this.engine = null;

    this.engine = await this.createEngine();
    try {
      this.dataSchema = await this.engine.load(config);
    } catch (error) {
      await this.engine.dispose();
      this.engine = null;
      throw error;
    }
  }

  /**
   * Describe the data source structure.
   * Include tables, fields, types, indexes, and relations.
   */
  async schema(): Promise<Schema> {
    if (!this.dataSchema) {
      throw new Error('No data loaded. Please call source() first.');
    }
    return this.dataSchema;
  }

  /**
   * Compute a statistical profile of the data source.
   */
  async profile(options: ProfileOptions = {}): Promise<Profile> {
    if (!this.engine || !this.dataSchema) {
      throw new Error('No data loaded. Please call source() first.');
    }
    if (!this.engine.profile) {
      throw new Error('Profiling is not supported by the registered engine.');
    }

    this.dataProfile = await this.engine.profile(options);
    return this.dataProfile;
  }

  /**
   * Analyze data using natural language query.
   * The query is turned into SQL via LLM and executed by DuckDB.
   * Use visualize() separately to generate charts from the analysis result.
   */
  async analyze(query: string, config: AnalysisConfig = {}): Promise<AnalysisResponse> {
    if (!this.engine || !this.dataSchema) {
      throw new Error('No data loaded. Please call source() first.');
    }

    const runtime = {
      context: { schema: this.dataSchema, profile: this.dataProfile ?? undefined },
      engine: this.engine,
      llm: this.llmConfig,
    };

    return analyze(query, config, runtime);
  }

  /**
   * Translate a natural-language query into DSL.
   * Use query() to execute the generated DSL.
   */
  // @ts-expect-error Internal API is not yet used by the analysis strategies.
  private async translate(query: string): Promise<string> {
    if (!this.engine || !this.dataSchema) {
      throw new Error('No data loaded. Please call source() first.');
    }
    return this.engine.getDSL(query, {
      schema: this.dataSchema,
      profile: this.dataProfile ?? undefined,
    });
  }

  /**
   * Execute a read-only query against the data source.
   * The DSL must match the current engine's query language.
   */
  // @ts-expect-error Internal API is not yet used by the analysis strategies.
  private async query(dsl: string, options?: ExecutionOptions): Promise<ExecutionResult> {
    if (!this.engine || !this.dataSchema) {
      throw new Error('No data loaded. Please call source() first.');
    }
    return this.engine.execute(dsl, options);
  }

  /**
   * Visualize analysis data by recommending a chart type and generating chart HTML.
   * Accepts the result from analyze() — the query and data are read from it.
   *
   * @param analysisResult - The result returned from analyze()
   * @param options - Optional visualization options
   * @returns VisualizeResponse with chartType, syntax, and html, or null if no visualization is needed
   */
  async visualize(analysisResult: AnalysisResponse): Promise<VisualizeResponse | null> {
    try {
      const spec = await this.recommend(analysisResult);
      return spec ? { ...spec, html: await this.viz(spec) } : null;
    } catch (error) {
      // Visualization is optional, don't fail if it fails
      const errorMessage = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.warn('Failed to generate visualization:', errorMessage);
      return null;
    }
  }

  /**
   * Recommend a chart specification for the analysis result.
   * Combine a suitable chart type with GPT-Vis syntax for rendering.
   */
  private async recommend(analysisResult: AnalysisResponse): Promise<ChartSpec | null> {
    const { data, query } = analysisResult;
    if (!hasData(data)) return null;

    const dataInfo = Array.isArray(data) ? stringifySchema(extractDataSchema(data)) : JSON.stringify(data);
    const chartType = await adviseChartType(query, dataInfo, this.llmConfig);
    if (!chartType) return null;

    const syntax = await generateVisualizationSyntax(chartType, data, query, this.llmConfig);
    return { chartType, syntax };
  }

  /**
   * Render a chart specification as standalone HTML.
   */
  private async viz(spec: ChartSpec): Promise<string> {
    return wrapSyntaxInHTML(spec.syntax);
  }

  /**
   * Suggest questions about the loaded data.
   */
  async suggest(count: number = 3): Promise<SuggestResult[]> {
    if (!this.dataSchema) {
      throw new Error('No data loaded. Please call load() first.');
    }

    return generateSuggestions(
      this.llmConfig,
      { schema: this.dataSchema, profile: this.dataProfile ?? undefined },
      count
    );
  }

  /**
   * Clean up resources (engine storage, temp files)
   */
  async dispose(): Promise<void> {
    await this.engine?.dispose();
    this.engine = null;
    this.dataSchema = null;
    this.dataProfile = null;
  }
}
