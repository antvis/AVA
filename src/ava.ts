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
  EventCollector,
  EvidenceChain,
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

/** Escape HTML special characters to prevent injection in the evidence report. */
function escapeHTML(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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
      emit(this, new LifecycleEvent(LifecycleEventType.CREATE_END, { error: serializeError(error) }));

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
      emit(this, new LifecycleEvent(LifecycleEventType.DISPOSE_END, { error: serializeError(error) }));

      throw error;
    }

    emit(this, new LifecycleEvent(LifecycleEventType.DISPOSE_END));
  }

  /**
   * Load a data source config into the engine.
   * Reloading disposes the previous engine and its resources.
   */
  async source(config: DataSourceConfig): Promise<void> {
    emit(this, new ExecutionEvent(ExecutionEventType.LOAD_START, config));

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

    emit(this, new ExecutionEvent(ExecutionEventType.LOAD_END));
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

    emit(this, new ExecutionEvent(ExecutionEventType.PROFILE_START));

    try {
      this.dataProfile = await this.engine.profile(options);
    } catch (error) {
      emit(this, new ExecutionEvent(ExecutionEventType.PROFILE_END, { error: serializeError(error) }));

      throw error;
    }

    emit(this, new ExecutionEvent(ExecutionEventType.PROFILE_END));

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
      emit: (event: AnalysisEvent) => emit(this, event),
      context: { schema: this.dataSchema, profile: this.dataProfile ?? undefined },
      engine: this.engine,
      llm: this.llmConfig,
    };

    emit(this, new ExecutionEvent(ExecutionEventType.ANALYZE_START, { query }));

    let result: AnalysisResponse;
    try {
      result = await analyze(query, config, runtime);
    } catch (error) {
      emit(this, new ExecutionEvent(ExecutionEventType.ANALYZE_END, { error: serializeError(error) }));

      throw error;
    }

    emit(this, new ExecutionEvent(ExecutionEventType.ANALYZE_END));

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

    emit(this, new AnalysisEvent(AnalysisEventType.QUERY_START, { dsl }));

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
    emit(this, new ExecutionEvent(ExecutionEventType.VISUALIZE_START, { query: analysisResult.query }));

    let result: VisualizeResponse | null;
    try {
      const spec = await this.recommend(analysisResult);
      result = spec ? { ...spec, html: await this.viz(spec) } : null;
    } catch (error) {
      emit(this, new ExecutionEvent(ExecutionEventType.VISUALIZE_END, { error: serializeError(error) }));

      throw error;
    }

    emit(
      this,
      new ExecutionEvent(
        ExecutionEventType.VISUALIZE_END,
        result
          ? {
              chartType: result.chartType,
              chartSyntax: result.syntax,
            }
          : {}
      )
    );

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

    emit(this, new ExecutionEvent(ExecutionEventType.SUGGEST_START));

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

    emit(this, new ExecutionEvent(ExecutionEventType.SUGGEST_END));

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

  /**
   * Create an EventCollector bound to this instance and start collecting.
   * The collector records every lifecycle, execution, and analysis event
   * with timestamps, forming an evidence trail of the full session.
   *
   * @example
   * const collector = ava.collectEvents();
   * await ava.source(config);
   * await ava.analyze('What is the average revenue?');
   * collector.trail();       // readonly EvidenceRecord[]
   * collector.filter('analysis'); // analysis-phase events only
   * collector.toJSON();     // serialized trail
   */
  collectEvents(): EventCollector {
    const collector = new EventCollector();
    collector.attach(this);
    return collector;
  }

  /**
   * Export the evidence chain collected by an `EventCollector` to a file.
   *
   * `format: 'json'` (default) writes two files:
   * - `<path>` — the structured evidence chain
   * - `<path>.trail.json` — the raw event trail
   *
   * `format: 'html'` writes a single self-contained HTML report.
   *
   * @example
   * const collector = ava.collectEvents();
   * await ava.source(config);
   * await ava.analyze('What is the average revenue?');
   * await ava.exportEvidence(collector, './.tmp/evidence/revenue.json');
   * await ava.exportEvidence(collector, './.tmp/evidence/revenue.html', { format: 'html' });
   */
  async exportEvidence(
    collector: EventCollector,
    path: string,
    options?: { format?: 'json' | 'html' }
  ): Promise<void> {
    const format = options?.format ?? 'json';
    const chain = new EvidenceChain(collector.trail());
    const data = chain.build();

    const { writeFile, mkdir } = await import('node:fs/promises');
    const { dirname } = await import('node:path');
    await mkdir(dirname(path), { recursive: true });

    if (format === 'html') {
      await writeFile(path, this.renderEvidenceHTML(data), 'utf8');
    } else {
      await writeFile(path, JSON.stringify(data, null, 2), 'utf8');
      const trailPath = path.endsWith('.json') ? `${path.slice(0, -5)}.trail.json` : `${path}.trail.json`;
      await writeFile(trailPath, collector.toJSON(), 'utf8');
    }
  }

  /** Render the evidence chain as a self-contained HTML report. */
  private renderEvidenceHTML(data: import('./util/event').EvidenceChainData): string {
    const sections: string[] = [];

    if (data.source) {
      sections.push(`      <section class="layer">
        <h2>1. Source</h2>
        <table><tbody>
          <tr><th>Type</th><td>${data.source.type}</td></tr>
          <tr><th>Options</th><td><pre>${JSON.stringify(data.source.options, null, 2)}</pre></td></tr>
          <tr><th>Loaded At</th><td>${new Date(data.source.timestamp).toISOString()}</td></tr>
        </tbody></table>
      </section>`);
    }

    if (data.definitions.length) {
      const rows = data.definitions
        .map(
          (d) =>
            `          <tr><td>${d.seq}</td><td><code>${escapeHTML(d.dsl)}</code></td><td>${new Date(
              d.timestamp
            ).toISOString()}</td></tr>`
        )
        .join('\n');
      sections.push(`      <section class="layer">
        <h2>2. Definitions</h2>
        <table><thead><tr><th>Seq</th><th>DSL</th><th>Timestamp</th></tr></thead><tbody>
${rows}
        </tbody></table>
      </section>`);
    }

    if (data.executions.length) {
      const rows = data.executions
        .map(
          (e) =>
            `          <tr><td>${e.id}</td><td><code>${escapeHTML(e.sql)}</code></td><td class="${e.status}">${
              e.status
            }</td><td>${e.exploratory ? 'explore' : 'answer'}</td><td>${e.truncated ?? ''}</td>${
              e.error ? `<td>${escapeHTML(e.error)}</td>` : ''
            }</tr>`
        )
        .join('\n');
      sections.push(`      <section class="layer">
        <h2>3. Executions</h2>
        <table><thead><tr><th>ID</th><th>SQL</th><th>Status</th><th>Type</th><th>Truncated</th><th>Error</th></tr></thead><tbody>
${rows}
        </tbody></table>
      </section>`);
    }

    if (data.results.length) {
      for (const r of data.results) {
        const cols = r.columns
          .map((c) => `<th>${c.name}${c.type ? ` <span class="type">${c.type}</span>` : ''}</th>`)
          .join('');
        const rows = r.rows
          .map(
            (row) => `<tr>${r.columns.map((c) => `<td>${escapeHTML(String(row[c.name] ?? ''))}</td>`).join('')}</tr>`
          )
          .join('\n');
        sections.push(`      <section class="layer">
        <h2>4. Result (execution #${r.executionId})</h2>
        <table><thead><tr>${cols}</tr></thead><tbody>
${rows}
        </tbody></table>
      </section>`);
      }
    }

    if (data.presentation) {
      sections.push(`      <section class="layer">
        <h2>5. Presentation</h2>
        <table><tbody>
          <tr><th>Query</th><td>${escapeHTML(data.presentation.query)}</td></tr>
          <tr><th>Summary</th><td>${escapeHTML(data.presentation.text)}</td></tr>
          <tr><th>Chart Type</th><td>${data.presentation.chartType ?? ''}</td></tr>
${
  data.presentation.chartSyntax
    ? `          <tr><th>Chart Syntax</th><td><pre>${escapeHTML(data.presentation.chartSyntax)}</pre></td></tr>\n`
    : ''
}        </tbody></table>
      </section>`);
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Evidence Chain</title>
  <style>
    body { font-family: -apple-system, sans-serif; margin: 24px; color: #333; }
    h1 { border-bottom: 1px solid #ddd; padding-bottom: 8px; }
    .layer { margin-bottom: 24px; }
    .layer h2 { font-size: 16px; color: #666; margin-bottom: 8px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
    th { background: #f5f5f5; }
    .type { color: #999; font-size: 11px; }
    .success { color: #52c41a; }
    .error { color: #ff4d4f; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-all; }
    code { font-size: 12px; }
  </style>
</head>
<body>
  <h1>Evidence Chain</h1>
${sections.join('\n\n')}
</body>
</html>`;
  }
}
