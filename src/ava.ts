/**
 * AVA v4 - A framework for AI-native Visual Analytics
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { DuckDBEngine } from './duckdb';
import { extractDataSchema, stringifySchema } from './util/schema';
import { adviseChartType, generateVisualizationHTML } from './visualization';
import { generateSuggestions } from './suggest';

import type {
  AVAConfig,
  LLMConfig,
  DataSourceConfig,
  Schema,
  AnalysisResponse,
  VisualizeResponse,
  SuggestResult,
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
  private engine: DuckDBEngine | null = null;
  private schema: Schema | null = null;

  constructor(config: AVAConfig) {
    this.llmConfig = config.llm;
  }

  /**
   * Load a data source config into the engine.
   * Reloading disposes the previous engine and its resources.
   */
  async loadSource(config: DataSourceConfig): Promise<Schema> {
    await this.engine?.dispose();

    this.engine = new DuckDBEngine(this.llmConfig);
    try {
      this.schema = await this.engine.load(config);
    } catch (error) {
      await this.engine.dispose();
      this.engine = null;
      throw error;
    }
    return this.schema;
  }

  /**
   * Load CSV file — shortcut for loadSource({ type: 'csv', options: { pathOrContent } })
   * @returns Dataset metadata
   */
  async loadCSV(filePath: string): Promise<Schema> {
    return this.loadSource({ type: 'csv', options: { pathOrContent: filePath } });
  }

  /**
   * Load data from JSON object array — shortcut for loadSource({ type: 'object', options: { data } })
   * @returns Dataset metadata
   */
  async loadObject(data: any[]): Promise<Schema> {
    return this.loadSource({ type: 'object', options: { data } });
  }

  /**
   * Load data from URL — shortcut for loadSource({ type: 'url', options: { url, transform } })
   * @returns Dataset metadata
   */
  async loadURL(url: string, transform?: (response: any) => any[]): Promise<Schema> {
    return this.loadSource({ type: 'url', options: { url, transform } });
  }

  /**
   * Load data from text using LLM — shortcut for loadSource({ type: 'text', options: { text } })
   * @returns Dataset metadata
   */
  async loadText(text: string): Promise<Schema> {
    return this.loadSource({ type: 'text', options: { text } });
  }

  /**
   * Analyze data using natural language query.
   * The query is turned into SQL via LLM and executed by DuckDB.
   * Use visualize() separately to generate charts from the analysis result.
   */
  async analysis(query: string): Promise<AnalysisResponse> {
    if (!this.engine || !this.schema) {
      throw new Error(
        'No data loaded. Please call one of the load methods first (loadCSV, loadObject, loadURL, loadText, or loadSource).'
      );
    }

    const sql = await this.engine.getDSL(query);
    const data = await this.engine.execute(sql);
    const summary = await this.summarizeResult(query, data);

    return {
      query,
      text: summary,
      data,
      sql,
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
      // Describe the result data for the chart advisor; non-array data falls back to raw JSON
      const analysisSchemaStr = Array.isArray(data)
        ? stringifySchema(extractDataSchema(data))
        // TODO - Consider using a more structured schema for non-array data, e.g., object keys and types
        : JSON.stringify(data);

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
    if (!this.schema) {
      throw new Error(
        'No data loaded. Please call one of the load methods first (loadCSV, loadObject, loadURL, loadText, or loadSource).'
      );
    }

    return generateSuggestions(this.llmConfig, this.schema, count);
  }

  /**
   * Clean up resources (engine storage, temp files)
   */
  async dispose(): Promise<void> {
    await this.engine?.dispose();
    this.engine = null;
    this.schema = null;
  }
}
