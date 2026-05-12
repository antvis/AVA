/**
 * AVA v4 - A framework for AI-native Visual Analytics
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { loadCSV, loadObject, loadURL, loadText, extractMetadata, formatDatasetInfo } from './data';
import {
  SQLiteDataStore,
  IndexedDBDataStore,
  executeDataCode,
  generateSQL,
  generateDataCode,
} from './analysis';
import {
  adviseChartType,
  generateVisualizationHTML,
} from './visualization';
import { generateSuggestions } from './suggest';

import type { AVAConfig, LLMConfig, DatasetInfo, AnalysisResponse, SuggestResult } from './types';

const DEFAULT_SQL_THRESHOLD = 100 * 1024; // 100KB

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
export class AVA {
  private readonly llmConfig: LLMConfig;
  private readonly sqlThreshold: number;
  private data: any[] | null = null;
  private dataInfo: DatasetInfo | null = null;
  private sqliteStore: SQLiteDataStore | null = null;
  private indexedDBStore: IndexedDBDataStore | null = null;

  constructor(config: AVAConfig) {
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
    }
  }

  /**
   * Analyze data using natural language query
   */
  async analysis(query: string): Promise<AnalysisResponse> {
    if (!this.dataInfo) {
      throw new Error('No data loaded. Please call one of the load methods first (loadCSV, loadObject, loadURL, or loadText).');
    }

    let analysisData: any = undefined;
    let analysisCode: string | undefined;
    let analysisSql: string | undefined;

    // Use SQLite for large datasets in Node.js
    if (this.sqliteStore) {
      const schema = await this.sqliteStore.getSchema();
      const sql = await generateSQL(this.llmConfig, schema, query);
      analysisSql = sql;

      try {
        analysisData = await this.sqliteStore.query(sql);
      } catch (error) {
        throw new Error(
          `Failed to execute SQL query: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } else if (this.indexedDBStore) {
      // Use IndexedDB for large datasets in browser
      const rowCount = await this.indexedDBStore.getRowCount();

      // Warn for very large datasets that will be loaded into memory
      if (rowCount > 50000) {
        // eslint-disable-next-line no-console
        console.warn(
          `[AVA] Loading ${rowCount.toLocaleString()} rows from IndexedDB into memory. ` +
          'This may cause performance issues. Consider reducing data size or using a backend service.'
        );
      }

      const data = await this.indexedDBStore.getAllData();

      const dataInfoStr = formatDatasetInfo(this.dataInfo);
      const code = await generateDataCode(this.llmConfig, dataInfoStr, query);
      analysisCode = code;

      try {
        analysisData = await executeDataCode(data, code);
      } catch (error) {
        throw new Error(
          `Failed to execute data code: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } else {
      // Use JavaScript for small datasets
      if (!this.data) {
        throw new Error('Data not available in memory.');
      }

      const dataInfoStr = formatDatasetInfo(this.dataInfo);
      const code = await generateDataCode(this.llmConfig, dataInfoStr, query);
      analysisCode = code;

      try {
        analysisData = await executeDataCode(this.data, code);
      } catch (error) {
        throw new Error(
          `Failed to execute data code: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Summarize the result using LLM
    const summary = await this.summarizeResult(query, analysisData);

    // Detect visualization intent and generate visualization if needed
    let visualizationHTML: string | undefined;
    let visualizationSyntax: string | undefined;
    try {
      // adviseChartType uses describeData which handles any data format
      const chartType = await adviseChartType(query, analysisData, this.llmConfig);
      if (chartType && hasData(analysisData)) {
        // generateVisualizationHTML uses JSON.stringify which handles any JSON-serializable data
        const result = await generateVisualizationHTML(chartType, analysisData, query, this.llmConfig);
        visualizationSyntax = result.syntax;
        visualizationHTML = result.html;
      }
    } catch (error) {
      // Visualization is optional, don't fail the analysis if it fails
      const errorMessage = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.warn('Failed to generate visualization:', errorMessage);
    }

    return {
      text: summary,
      data: analysisData,
      code: analysisCode,
      sql: analysisSql,
      visualizationSyntax,
      visualizationHTML,
    };
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
      throw new Error('No data loaded. Please call one of the load methods first (loadCSV, loadObject, loadURL, or loadText).');
    }

    return generateSuggestions(this.llmConfig, this.dataInfo, count);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
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
