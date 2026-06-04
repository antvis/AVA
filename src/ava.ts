/**
 * AVA v4 - A framework for AI-native Visual Analytics
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import {
  loadCSV,
  loadObject,
  loadURL,
  loadText,
  extractMetadata,
  formatDatasetInfo,
  formatDatasetInfoWithNonArray,
} from './data';
import { SQLiteDataStore, IndexedDBDataStore, executeDataCode, generateSQL, generateDataCode } from './analysis';
import { adviseChartType, generateVisualizationHTML } from './visualization';
import { generateSuggestions } from './suggest';
import { EventEmitter } from './events';
import { STEP_PHASE } from './types';

import type {
  AVAConfig,
  LLMConfig,
  DatasetInfo,
  AnalysisResponse,
  VisualizeResponse,
  SuggestResult,
} from './types';

const DEFAULT_SQL_THRESHOLD = 10 * 1024; // 10KB
const MAX_IN_MEMORY_BYTES = 20 * 1024 * 1024; // 20MB — browser is not a big-data environment

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
 * Main AVA class for AI-native visual analytics
 */
export class AVA extends EventEmitter {
  private readonly llmConfig: LLMConfig;
  private readonly sqlThreshold: number;
  private data: any[] | null = null;
  private dataInfo: DatasetInfo | null = null;
  private sqliteStore: SQLiteDataStore | null = null;
  private indexedDBStore: IndexedDBDataStore | null = null;

  constructor(config: AVAConfig) {
    super();
    this.llmConfig = config.llm;
    this.sqlThreshold = config.sqlThreshold || DEFAULT_SQL_THRESHOLD;
  }

  /**
   * Load CSV file
   * @returns The loaded structured data
   */
  async loadCSV(filePath: string): Promise<any[]> {
    this.data = await loadCSV(filePath);
    const loadedData = [...this.data];
    await this.processLoadedData();
    return loadedData;
  }

  /**
   * Load data from JSON object array
   * @returns The loaded structured data
   */
  async loadObject(data: any[]): Promise<any[]> {
    this.data = await loadObject(data);
    const loadedData = [...this.data];
    await this.processLoadedData();
    return loadedData;
  }

  /**
   * Load data from URL
   * @returns The loaded structured data
   */
  async loadURL(url: string, transform?: (response: any) => any[]): Promise<any[]> {
    this.data = await loadURL(url, transform);
    const loadedData = [...this.data];
    await this.processLoadedData();
    return loadedData;
  }

  /**
   * Load data from text using LLM
   * @returns The loaded structured data
   */
  async loadText(text: string): Promise<any[]> {
    this.data = await loadText(text, this.llmConfig);
    const loadedData = [...this.data];
    await this.processLoadedData();
    return loadedData;
  }

  /**
   * Check if IndexedDB is available in the current environment
   */
  private hasIndexedDB(): boolean {
    // eslint-disable-next-line no-undef
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  /**
   * Process loaded data: extract metadata and load into storage if large
   * Uses SQLite for Node.js, IndexedDB for browser (with fallback to memory)
   */
  private async processLoadedData(): Promise<void> {
    if (!this.data) {
      throw new Error('No data to process');
    }

    this.dataInfo = extractMetadata(this.data);

    // If data is large, load into appropriate storage
    if (this.dataInfo.sizeInBytes > this.sqlThreshold) {
      const isNode = typeof window === 'undefined';

      if (isNode) {
        // Node.js environment: use SQLite
        this.sqliteStore = new SQLiteDataStore();
        await this.sqliteStore.loadData(this.data);
        // Clear data from memory to save space
        this.data = null;
      } else if (this.hasIndexedDB()) {
        // Browser environment with IndexedDB support
        this.indexedDBStore = new IndexedDBDataStore();
        await this.indexedDBStore.loadData(this.data);
        // Clear data from memory to save space
        this.data = null;
      } else {
        // Browser without IndexedDB: keep in memory with warning
        // eslint-disable-next-line no-console
        console.warn(
          '[AVA] IndexedDB is not available in this environment. ' +
            'Large datasets may cause memory issues. ' +
            'Consider using a modern browser or reducing data size.'
        );
        // Keep data in memory (this.data remains set)
      }
    } else {
      // Data is small — clean up stale store references from previous loads
      if (this.sqliteStore) {
        this.sqliteStore.close();
        this.sqliteStore = null;
      }
      if (this.indexedDBStore) {
        await this.indexedDBStore.deleteDatabase();
        this.indexedDBStore = null;
      }
    }
  }

  /**
   * Analyze data using natural language query.
   * Returns analysis results (text summary + data + code/sql).
   * Use visualize() separately to generate charts from the analysis result.
   */
  async analysis(query: string): Promise<AnalysisResponse> {
    if (!this.dataInfo) {
      throw new Error(
        'No data loaded. Please call one of the load methods first (loadCSV, loadObject, loadURL, or loadText).'
      );
    }

    let analysisData: any = undefined;
    let analysisCode: string | undefined;
    let analysisSql: string | undefined;
    const dataInfoStr = formatDatasetInfo(this.dataInfo);

    // Use SQLite for large datasets in Node.js
    if (this.sqliteStore) {
      const schema = await this.sqliteStore.getSchema();

      this.emit('step', { phase: STEP_PHASE.SQL_CODE, status: 'running' });
      const sql = await generateSQL(this.llmConfig, schema, query);
      analysisSql = sql;
      this.emit('step', { phase: STEP_PHASE.SQL_CODE, status: 'done', detail: sql });

      this.emit('step', { phase: STEP_PHASE.EXECUTE, status: 'running' });
      analysisData = await this.sqliteStore.query(sql);
      this.emit('step', {
        phase: STEP_PHASE.EXECUTE,
        status: 'done',
        detail: `Returned ${analysisData.length} records`,
      });
    } else if (this.indexedDBStore) {
      // Use IndexedDB for large datasets in browser
      const estimatedBytes = await this.indexedDBStore.estimateMemorySize();

      if (estimatedBytes > MAX_IN_MEMORY_BYTES) {
        throw new Error(
          'Dataset too large for browser analysis ' +
            `(estimated ${(estimatedBytes / 1024 / 1024).toFixed(1)}MB). ` +
            'The browser environment is not suitable for large-scale data processing. ' +
            'Please use the Node.js backend (SQLite) for full-dataset analysis, ' +
            'or reduce the data size before loading.'
        );
      }

      const data = await this.indexedDBStore.getAllData();

      this.emit('step', { phase: STEP_PHASE.JS_CODE, status: 'running' });
      const code = await generateDataCode(this.llmConfig, dataInfoStr, query);
      analysisCode = code;
      this.emit('step', { phase: STEP_PHASE.JS_CODE, status: 'done', detail: code });

      this.emit('step', { phase: STEP_PHASE.EXECUTE, status: 'running' });
      analysisData = await executeDataCode(data, code);
      this.emit('step', {
        phase: STEP_PHASE.EXECUTE,
        status: 'done',
        detail: `Returned ${analysisData.length} records`,
      });
    } else {
      // Use JavaScript for small datasets
      if (!this.data) {
        throw new Error('Data not available in memory.');
      }

      this.emit('step', { phase: STEP_PHASE.JS_CODE, status: 'running' });
      const code = await generateDataCode(this.llmConfig, dataInfoStr, query);
      analysisCode = code;
      this.emit('step', { phase: STEP_PHASE.JS_CODE, status: 'done', detail: code });

      this.emit('step', { phase: STEP_PHASE.EXECUTE, status: 'running' });
      analysisData = await executeDataCode(this.data, code);
      this.emit('step', {
        phase: STEP_PHASE.EXECUTE,
        status: 'done',
        detail: `Returned ${analysisData.length} records`,
      });
    }

    // Summarize the result using LLM
    this.emit('step', { phase: STEP_PHASE.SUMMARIZE, status: 'running' });
    const summary = await this.summarizeResult(query, analysisData);
    this.emit('step', { phase: STEP_PHASE.SUMMARIZE, status: 'done', detail: summary });

    return {
      query,
      text: summary,
      data: analysisData,
      code: analysisCode,
      sql: analysisSql,
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

      this.emit('step', { phase: STEP_PHASE.ADVISOR, status: 'running' });
      const chartType = await adviseChartType(query, analysisDataInfoStr, this.llmConfig);
      this.emit('step', {
        phase: STEP_PHASE.ADVISOR,
        status: 'done',
        detail: chartType ?? 'No visualization needed',
      });

      if (!chartType) {
        return null;
      }

      this.emit('step', { phase: STEP_PHASE.VISUALIZE, status: 'running' });
      const result = await generateVisualizationHTML(chartType, data, query, this.llmConfig);
      this.emit('step', {
        phase: STEP_PHASE.VISUALIZE,
        status: 'done',
        detail: result.syntax || '',
      });

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
        'No data loaded. Please call one of the load methods first (loadCSV, loadObject, loadURL, or loadText).'
      );
    }

    return generateSuggestions(this.llmConfig, this.dataInfo, count);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.removeAllListeners();
    if (this.sqliteStore) {
      this.sqliteStore.close();
      this.sqliteStore = null;
    }
    if (this.indexedDBStore) {
      this.indexedDBStore.close();
      this.indexedDBStore = null;
    }
    this.data = null;
    this.dataInfo = null;
  }
}
