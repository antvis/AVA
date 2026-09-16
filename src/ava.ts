/**
 * AVA v4 - A framework for AI-native Visual Analytics
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import {
  CodeEngine,
  loadCSV,
  loadObject,
  loadURL,
  loadText,
  extractMetadata,
  formatDatasetInfo,
  formatDatasetInfoWithNonArray,
} from './code';
import { DuckDBEngine, resolveSource } from './duckdb';
import { adviseChartType, generateVisualizationHTML } from './visualization';
import { generateSuggestions } from './suggest';

import type {
  AnalysisEngine,
  AVAConfig,
  LLMConfig,
  EngineType,
  DataSource,
  DataSourceConfig,
  DatasetInfo,
  AnalysisResponse,
  VisualizeResponse,
  SuggestResult,
} from './types';

const DEFAULT_ENGINE: EngineType = 'code';

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
 * Data loading produces a DataSource; analysis() delegates to the configured
 * engine ('code' | 'duckdb') and is agnostic to how queries are executed.
 */
export class AVA {
  private readonly llmConfig: LLMConfig;
  private readonly engineType: EngineType;
  private engine: AnalysisEngine | null = null;
  private dataInfo: DatasetInfo | null = null;

  constructor(config: AVAConfig) {
    this.llmConfig = config.llm;
    this.engineType = config.engine ?? DEFAULT_ENGINE;
  }

  /**
   * Load a data source into the configured engine.
   * Reloading disposes the previous engine and its resources.
   */
  private async load(source: DataSource): Promise<DatasetInfo> {
    await this.engine?.dispose();

    this.engine =
      this.engineType === 'duckdb' ? new DuckDBEngine(this.llmConfig) : new CodeEngine(this.llmConfig);
    try {
      this.dataInfo = await this.engine.load(source);
    } catch (error) {
      await this.engine.dispose();
      this.engine = null;
      throw error;
    }
    return this.dataInfo;
  }

  /**
   * Load CSV file
   * @returns Dataset metadata
   */
  async loadCSV(filePath: string): Promise<DatasetInfo> {
    return this.load({ kind: 'inline', data: await loadCSV(filePath) });
  }

  /**
   * Load data from JSON object array
   * @returns Dataset metadata
   */
  async loadObject(data: any[]): Promise<DatasetInfo> {
    return this.load({ kind: 'inline', data: await loadObject(data) });
  }

  /**
   * Load data from URL
   * @returns Dataset metadata
   */
  async loadURL(url: string, transform?: (response: any) => any[]): Promise<DatasetInfo> {
    return this.load({ kind: 'inline', data: await loadURL(url, transform) });
  }

  /**
   * Load data from text using LLM
   * @returns Dataset metadata
   */
  async loadText(text: string): Promise<DatasetInfo> {
    return this.load({ kind: 'inline', data: await loadText(text, this.llmConfig) });
  }

  /**
   * Load an external data source into DuckDB (Node.js only, requires engine: 'duckdb').
   * File sources (csv/json/parquet) may be local paths or http(s) URLs — remote files
   * are downloaded first, so OSS/S3 signed URLs work through the same path.
   * Database sources (mysql/postgresql) are reserved and not implemented yet.
   * Data is never materialized into JS memory.
   * @returns Dataset metadata inferred by DuckDB
   * @example
   * ```typescript
   * const ava = new AVA({ llm, engine: 'duckdb' });
   * await ava.loadSource({ type: 'csv', options: { path: './data/companies.csv' } });
   * await ava.loadSource({ type: 'parquet', options: { path: 'https://example.com/data.parquet' } });
   * await ava.loadSource({ type: 'csv', options: { path: signedOssUrl, headers: { ... } } });
   * ```
   */
  async loadSource(source: DataSourceConfig): Promise<DatasetInfo> {
    if (this.engineType !== 'duckdb') {
      throw new Error('loadSource requires engine: "duckdb" — file/remote sources are queried via DuckDB SQL.');
    }
    return this.load(await resolveSource(source));
  }

  /**
   * Analyze data using natural language query.
   * Delegates execution to the configured engine (code or duckdb).
   * Use visualize() separately to generate charts from the analysis result.
   */
  async analysis(query: string): Promise<AnalysisResponse> {
    if (!this.engine || !this.dataInfo) {
      throw new Error(
        'No data loaded. Please call one of the load methods first (loadCSV, loadObject, loadURL, loadText, or loadSource).'
      );
    }

    const dsl = await this.engine.getDSL(query);
    const data = await this.engine.execute(dsl);

    // Summarize the result using LLM
    const summary = await this.summarizeResult(query, data);

    return {
      query,
      text: summary,
      data,
      engine: this.engineType,
      dsl,
    };
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
      // Format analysis data info from the analysis result data
      const analysisDataInfoStr = Array.isArray(data)
        ? formatDatasetInfo(extractMetadata(data))
        : formatDatasetInfoWithNonArray(data);

      const chartType = await adviseChartType(query, analysisDataInfoStr, this.llmConfig);

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

  /**
   * Summarize analysis result using LLM
   */
  private async summarizeResult(query: string, data: any): Promise<string> {
    const openai = createOpenAI({
      apiKey: this.llmConfig.apiKey,
      baseURL: this.llmConfig.baseURL,
    });

    const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);

    const prompt = `You are a data analysis assistant. Based on the following query and analysis result, provide a clear and concise summary.

User Query: ${query}

Analysis Result:
${dataStr}

IMPORTANT: Detect the language of the user query. You MUST write your summary in the SAME language as the user query. For example, if the query is in Chinese, write the summary in Chinese; if in English, write in English; if in Japanese, write in Japanese. If the query language is ambiguous, default to English.

Provide a natural language summary of the result. If the result is tabular data, you can present it as a markdown table.`;

    const { text } = await generateText({
      model: openai(this.llmConfig.model) as any,
      prompt,
    });

    return text;
  }

  /**
   * Suggest analysis queries based on loaded data
   * @param count Number of queries to suggest (default: 3)
   * @returns Array of suggested queries with scores and reasons
   */
  async suggest(count: number = 3): Promise<SuggestResult[]> {
    if (!this.dataInfo) {
      throw new Error(
        'No data loaded. Please call one of the load methods first (loadCSV, loadObject, loadURL, loadText, or loadSource).'
      );
    }

    return generateSuggestions(this.llmConfig, this.dataInfo, count);
  }

  /**
   * Clean up resources (engine storage, temp files)
   */
  async dispose(): Promise<void> {
    await this.engine?.dispose();
    this.engine = null;
    this.dataInfo = null;
  }
}
