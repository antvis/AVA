/**
 * AVA v4 - A framework for AI-native Visual Analytics
 */
import EventEmitter from '@antv/event-emitter';

import { getEngineClass } from './engines';
import { extractDataSchema } from './util/schema';
import { stringifySchema } from './util/context';
import { adviseChartType, generateVisualizationSyntax, wrapSyntaxInHTML } from './visualization';
import { generateSuggestions } from './suggest';
import { analyze } from './analysis';
import {
  LifecycleEventType,
  LifecycleEvent,
  ExecutionEventType,
  ExecutionEvent,
  AnalysisEventType,
  AnalysisEvent,
  emit,
} from './util/event';
import { serializeError } from './util/error';

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
 * Data loading and analysis are backed by a pluggable engine — natural-language
 * queries are turned into SQL via LLM and executed by the configured engine.
 */
export class AVA extends EventEmitter {
  private readonly llmConfig: LLMConfig;
  private readonly engineConfig: EngineConfig;
  engine: AnalysisEngine | null = null;
  private dataSchema: Schema | null = null;
  private dataProfile: Profile | null = null;

  constructor(config: AVAConfig) {
    super();
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

    emit(this, new LifecycleEvent(LifecycleEventType.CREATE_START));

    let engine: AnalysisEngine;
    try {
      const EngineClass = getEngineClass(type);
      engine = new EngineClass(this.llmConfig, options);
    } catch (error) {
      emit(this, new LifecycleEvent(LifecycleEventType.CREATE_END, serializeError(error)));

      throw error;
    }

    emit(this, new LifecycleEvent(LifecycleEventType.CREATE_END));

    return engine;
  }

  /**
   * Release the current engine, including replacement and failed-load cleanup.
   */
  private async disposeEngine(): Promise<void> {
    if (!this.engine) return;

    emit(this, new LifecycleEvent(LifecycleEventType.DISPOSE_START));

    try {
      await this.engine.dispose();
    } catch (error) {
      emit(this, new LifecycleEvent(LifecycleEventType.DISPOSE_END, serializeError(error)));

      throw error;
    }

    emit(this, new LifecycleEvent(LifecycleEventType.DISPOSE_END));
  }

  /**
   * Load a data source config into the engine.
   * Reloading disposes the previous engine and its resources.
   */
  async source(config: DataSourceConfig): Promise<void> {
    emit(this, new ExecutionEvent(ExecutionEventType.LOAD_START, { type: config.type }));

    try {
      this.dataSchema = null;
      this.dataProfile = null;
      await this.disposeEngine();
      this.engine = null;

      this.engine = await this.createEngine();
      try {
        this.dataSchema = await this.engine.load(config);
      } catch (error) {
        await this.disposeEngine();
        this.engine = null;
        throw error;
      }
    } catch (error) {
      emit(this, new ExecutionEvent(ExecutionEventType.LOAD_END, { error: serializeError(error) }));

      throw error;
    }

    emit(this, new ExecutionEvent(ExecutionEventType.LOAD_END, this.dataSchema));
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

    emit(this, new ExecutionEvent(ExecutionEventType.PROFILE_START, { options }));

    try {
      this.dataProfile = await this.engine.profile(options);
    } catch (error) {
      emit(this, new ExecutionEvent(ExecutionEventType.PROFILE_END, { error: serializeError(error) }));

      throw error;
    }

    emit(this, new ExecutionEvent(ExecutionEventType.PROFILE_END, this.dataProfile));

    return this.dataProfile;
  }

  /**
   * Analyze data using natural language query.
   * The query is turned into SQL via LLM and executed by the configured engine.
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

    emit(this, new ExecutionEvent(ExecutionEventType.ANALYZE_START, { query, config }));

    let result: AnalysisResponse;
    try {
      result = await analyze(query, config, runtime);
    } catch (error) {
      emit(this, new ExecutionEvent(ExecutionEventType.ANALYZE_END, { error: serializeError(error) }));

      throw error;
    }

    emit(this, new ExecutionEvent(ExecutionEventType.ANALYZE_END, result));

    return result;
  }

  /**
   * Translate a natural-language query into DSL.
   * Use query() to execute the generated DSL.
   */
  async translate(query: string): Promise<string> {
    if (!this.engine || !this.dataSchema) {
      throw new Error('No data loaded. Please call source() first.');
    }

    emit(this, new AnalysisEvent(AnalysisEventType.TRANSLATE_START, { query }));

    let dsl: string;
    try {
      const context = { schema: this.dataSchema, profile: this.dataProfile ?? undefined };
      dsl = await this.engine.getDSL(query, context);
    } catch (error) {
      emit(this, new AnalysisEvent(AnalysisEventType.TRANSLATE_END, { error: serializeError(error) }));

      throw error;
    }

    emit(this, new AnalysisEvent(AnalysisEventType.TRANSLATE_END, { dsl }));

    return dsl;
  }

  /**
   * Execute a read-only query against the data source.
   * The DSL must match the current engine's query language.
   */
  async query(dsl: string, options?: ExecutionOptions): Promise<ExecutionResult> {
    if (!this.engine || !this.dataSchema) {
      throw new Error('No data loaded. Please call source() first.');
    }

    emit(this, new AnalysisEvent(AnalysisEventType.QUERY_START, { dsl, options }));

    let result: ExecutionResult;
    try {
      result = await this.engine.execute(dsl, options);
    } catch (error) {
      emit(this, new AnalysisEvent(AnalysisEventType.QUERY_END, { error: serializeError(error) }));

      throw error;
    }

    emit(this, new AnalysisEvent(AnalysisEventType.QUERY_END, result));

    return result;
  }

  /**
   * Visualize analysis data by recommending a chart type and generating chart HTML.
   * Accepts the result from analyze() — the query and data are read from it.
   *
   * @param analysisResult - The result returned from analyze()
   * @returns VisualizeResponse, or null if no chart is needed. Generation errors propagate to the caller.
   */
  async visualize(analysisResult: Pick<AnalysisResponse, 'query' | 'data'>): Promise<VisualizeResponse | null> {
    emit(this, new ExecutionEvent(ExecutionEventType.VISUALIZE_START, analysisResult));

    let result: VisualizeResponse | null;
    try {
      const spec = await this.recommend(analysisResult);
      result = spec ? { ...spec, html: await this.viz(spec) } : null;
    } catch (error) {
      emit(this, new ExecutionEvent(ExecutionEventType.VISUALIZE_END, { error: serializeError(error) }));

      throw error;
    }

    emit(this, new ExecutionEvent(ExecutionEventType.VISUALIZE_END, result));

    return result;
  }

  /**
   * Recommend a chart specification for the analysis result.
   * Combine a suitable chart type with GPT-Vis syntax for rendering.
   */
  async recommend(analysisResult: Pick<AnalysisResponse, 'query' | 'data'>): Promise<ChartSpec | null> {
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
  async viz(spec: ChartSpec): Promise<string> {
    return wrapSyntaxInHTML(spec.syntax);
  }

  /**
   * Suggest questions about the loaded data.
   */
  async suggest(count: number = 3): Promise<SuggestResult[]> {
    if (!this.dataSchema) {
      throw new Error('No data loaded. Please call source() first.');
    }

    emit(this, new ExecutionEvent(ExecutionEventType.SUGGEST_START, { count }));

    let result: SuggestResult[];
    try {
      result = await generateSuggestions(
        this.llmConfig,
        { schema: this.dataSchema, profile: this.dataProfile ?? undefined },
        count
      );
    } catch (error) {
      emit(this, new ExecutionEvent(ExecutionEventType.SUGGEST_END, { error: serializeError(error) }));

      throw error;
    }

    emit(this, new ExecutionEvent(ExecutionEventType.SUGGEST_END, result));

    return result;
  }

  /**
   * Clean up resources (engine storage, temp files)
   */
  async dispose(): Promise<void> {
    await this.disposeEngine();
    this.engine = null;
    this.dataSchema = null;
    this.dataProfile = null;
  }
}
