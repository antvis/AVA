/**
 * AVA v4 - A framework for AI-native Visual Analytics
 */

import { getEngineClass } from './engines';
import { extractDataSchema } from './util/schema';
import { stringifySchema } from './util/context';
import { adviseChartType, generateVisualizationHTML } from './visualization';
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
  SuggestResult,
  Profile,
  ProfileOptions,
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
  private schema: Schema | null = null;
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
  async load(config: DataSourceConfig): Promise<Schema> {
    this.schema = null;
    this.dataProfile = null;
    await this.engine?.dispose();
    this.engine = null;

    this.engine = await this.createEngine();
    try {
      this.schema = await this.engine.load(config);
      return this.schema;
    } catch (error) {
      await this.engine.dispose();
      this.engine = null;
      throw error;
    }
  }

  /**
   * Analyze data using natural language query.
   * The query is turned into SQL via LLM and executed by DuckDB.
   * Use visualize() separately to generate charts from the analysis result.
   */
  async analysis(query: string, config: AnalysisConfig = {}): Promise<AnalysisResponse> {
    if (!this.engine || !this.schema) {
      throw new Error('No data loaded. Please call load() first.');
    }

    const runtime = {
      context: { schema: this.schema, profile: this.dataProfile ?? undefined },
      engine: this.engine,
      llm: this.llmConfig,
    };

    return analyze(query, config, runtime);
  }

  /**
   * Visualize analysis data by recommending a chart type and generating chart HTML.
   * Accepts the result from analysis() — the query and data are read from it.
   *
   * @param analysisResult - The result returned from analysis()
   * @param options - Optional visualization options
   * @returns VisualizeResponse with chartType, syntax, and html, or null if no visualization is needed
   */
  async visualize(analysisResult: AnalysisResponse): Promise<VisualizeResponse | null> {
    const { data, query } = analysisResult;

    if (!hasData(data)) {
      return null;
    }

    try {
      // Describe the result data for the chart advisor; non-array data falls back to raw JSON
      const analysisSchemaStr = Array.isArray(data)
        ? stringifySchema(extractDataSchema(data))
        : // TODO - Consider using a more structured schema for non-array data, e.g., object keys and types
          JSON.stringify(data);

      const chartType = await adviseChartType(query, analysisSchemaStr, this.llmConfig);

      if (!chartType) {
        return null;
      }

      const result = await generateVisualizationHTML(chartType, data, query, this.llmConfig);

      return {
        chartType,
        syntax: result.syntax,
        html: result.html,
      };
    } catch (error) {
      // Visualization is optional, don't fail if it fails
      const errorMessage = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.warn('Failed to generate visualization:', errorMessage);
      return null;
    }
  }

  /** Compute and retain a dataset profile for subsequent model context. */
  async profile(options: ProfileOptions = {}): Promise<Profile> {
    if (!this.engine || !this.schema) {
      throw new Error('No data loaded. Please call load() first.');
    }
    if (!this.engine.profile) {
      throw new Error('Profiling is not supported by the registered engine.');
    }

    const engine = this.engine;
    const profile = await engine.profile(options);
    if (this.engine === engine) this.dataProfile = profile;
    return profile;
  }

  /**
   * Suggest questions about the loaded data.
   */
  async suggest(count: number = 3): Promise<SuggestResult[]> {
    if (!this.schema) {
      throw new Error('No data loaded. Please call load() first.');
    }

    return generateSuggestions(
      this.llmConfig,
      { schema: this.schema, profile: this.dataProfile ?? undefined },
      count
    );
  }

  /**
   * Clean up resources (engine storage, temp files)
   */
  async dispose(): Promise<void> {
    await this.engine?.dispose();
    this.engine = null;
    this.schema = null;
    this.dataProfile = null;
  }
}
