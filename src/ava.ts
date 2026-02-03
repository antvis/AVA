/**
 * AVA v4 - A framework for AI-native Visual Analytics
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { loadCSV, loadObject, loadURL, loadText, extractMetadata, formatDatasetInfo } from './data';
import {
  SQLiteDataStore,
  executeDataCode,
  generateSQL,
  generateDataCode,
} from './analysis';
import {
  adviseChartType,
  generateVisualizationHTML,
} from './visualization';

import type { AVAConfig, LLMConfig, DatasetInfo, AnalysisResponse } from './types';

const DEFAULT_SQL_THRESHOLD = 10 * 1024; // 10KB

/**
 * Main AVA class for AI-native visual analytics
 */
export class AVA {
  private readonly llmConfig: LLMConfig;
  private readonly sqlThreshold: number;
  private data: any[] | null = null;
  private dataInfo: DatasetInfo | null = null;
  private sqliteStore: SQLiteDataStore | null = null;

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
   * Process loaded data: extract metadata and load into SQLite if large
   */
  private async processLoadedData(): Promise<void> {
    if (!this.data) {
      throw new Error('No data to process');
    }

    this.dataInfo = extractMetadata(this.data);

    // If data is large, load into SQLite
    if (this.dataInfo.sizeInBytes > this.sqlThreshold) {
      this.sqliteStore = new SQLiteDataStore();
      await this.sqliteStore.loadData(this.data);
      // Clear data from memory to save space
      this.data = null;
    }
  }

  /**
   * Analyze data using natural language query
   */
  async analysis(query: string): Promise<AnalysisResponse> {
    if (!this.dataInfo) {
      throw new Error('No data loaded. Please call one of the load methods first (loadCSV, loadObject, loadURL, or loadText).');
    }

    let analysisData: any[] = [];
    let analysisCode: string | undefined;
    let analysisSql: string | undefined;

    // Use SQLite for large datasets
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
      // adviseChartType now handles both intent detection and chart selection
      // Returns null if no visualization intent detected
      const chartType = await adviseChartType(query, analysisData, this.llmConfig);
      
      if (chartType && analysisData.length > 0) {
        // generateVisualizationHTML now combines syntax generation and HTML generation
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
   * Clean up resources
   */
  dispose(): void {
    if (this.sqliteStore) {
      this.sqliteStore.close();
      this.sqliteStore = null;
    }
    this.data = null;
    this.dataInfo = null;
  }
}
