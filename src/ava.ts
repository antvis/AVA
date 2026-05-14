/**
 * AVA v4 - A framework for AI-native Visual Analytics
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { loadCSV, loadObject, loadURL, loadText, extractMetadata, formatDatasetInfo } from './data';
import { SQLiteDataStore, executeDataCode, generateSQL, generateDataCode } from './analysis';
import { adviseChartType, generateVisualizationHTML } from './visualization';
import { generateSuggestions } from './suggest';

import type {
  AVAConfig,
  LLMConfig,
  DatasetInfo,
  AnalysisResponse,
  AnalysisOptions,
  SuggestResult,
  AnalysisProgressCallback,
  StepEmitterParams,
  AnalysisStep,
} from './types';

const DEFAULT_SQL_THRESHOLD = 10 * 1024; // 10KB

enum STEP_PHASE {
  SQL_CODE = 'sqlCode',
  JS_CODE = 'jsCode',
  EXECUTE = 'execute',
  SUMMARIZE = 'summarize',
  ADVISOR = 'advisor',
  VISUALIZE = 'visualize',
}

const STEP_LABEL: Record<STEP_PHASE, string> = {
  [STEP_PHASE.SQL_CODE]: 'Generate SQL query',
  [STEP_PHASE.JS_CODE]: 'Generate analysis code',
  [STEP_PHASE.EXECUTE]: 'Execute analysis',
  [STEP_PHASE.SUMMARIZE]: 'Generate analysis summary',
  [STEP_PHASE.ADVISOR]: 'Detect chart type',
  [STEP_PHASE.VISUALIZE]: 'Generate visualization',
};

const createStepEmitter = (onProgress: AnalysisProgressCallback | undefined) => {
  let id = 0;
  const steps: AnalysisStep[] = [];

  return (params: StepEmitterParams | StepEmitterParams[]) => {
    const items = Array.isArray(params) ? params : [params];
    for (const item of items) {
      const existingIdx = steps.findIndex((s) => s.phase === item.phase);
      const label = STEP_LABEL[item.phase as STEP_PHASE];

      if (existingIdx !== -1) {
        steps[existingIdx] = {
          ...steps[existingIdx],
          status: item.params.status,
          timestamp: Date.now(),
          detail: item.params.detail,
          error: item.params.error,
        };
      } else {
        steps.push({
          id: String(id++),
          agent: 'main',
          phase: item.phase,
          label,
          status: item.params.status,
          timestamp: Date.now(),
          detail: item.params.detail,
          error: item.params.error,
        });
      }
    }
    onProgress?.([...steps]);
  };
};

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
  async analysis(query: string, options?: AnalysisOptions): Promise<AnalysisResponse> {
    if (!this.dataInfo) {
      throw new Error(
        'No data loaded. Please call one of the load methods first (loadCSV, loadObject, loadURL, or loadText).'
      );
    }

    const progress = createStepEmitter(options?.onProgress);
    let analysisData: any = undefined;
    let analysisCode: string | undefined;
    let analysisSql: string | undefined;

    // Use SQLite for large datasets
    if (this.sqliteStore) {
      const schema = await this.sqliteStore.getSchema();

      progress({ phase: STEP_PHASE.SQL_CODE, params: { status: 'running' } });
      let sql: string;
      try {
        sql = await generateSQL(this.llmConfig, schema, query);
      } catch (error) {
        progress({
          phase: STEP_PHASE.SQL_CODE,
          params: {
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          },
        });
        throw error;
      }
      analysisSql = sql;
      progress([
        { phase: STEP_PHASE.SQL_CODE, params: { status: 'done', detail: sql } },
        { phase: STEP_PHASE.EXECUTE, params: { status: 'running' } },
      ]);

      try {
        analysisData = await this.sqliteStore.query(sql);
        progress({
          phase: STEP_PHASE.EXECUTE,
          params: { status: 'done', detail: `Returned ${analysisData.length} records` },
        });
      } catch (error) {
        progress({
          phase: STEP_PHASE.EXECUTE,
          params: {
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          },
        });
        throw new Error(`Failed to execute SQL query: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      // Use JavaScript for small datasets
      if (!this.data) {
        throw new Error('Data not available in memory.');
      }

      const dataInfoStr = formatDatasetInfo(this.dataInfo);

      progress({ phase: STEP_PHASE.JS_CODE, params: { status: 'running' } });
      let code: string;
      try {
        code = await generateDataCode(this.llmConfig, dataInfoStr, query);
      } catch (error) {
        progress({
          phase: STEP_PHASE.JS_CODE,
          params: {
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          },
        });
        throw error;
      }
      analysisCode = code;
      progress([
        { phase: STEP_PHASE.JS_CODE, params: { status: 'done', detail: code } },
        { phase: STEP_PHASE.EXECUTE, params: { status: 'running' } },
      ]);

      try {
        analysisData = await executeDataCode(this.data, code);
        progress({
          phase: STEP_PHASE.EXECUTE,
          params: { status: 'done', detail: `Returned ${analysisData.length} records` },
        });
      } catch (error) {
        progress({
          phase: STEP_PHASE.EXECUTE,
          params: {
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          },
        });
        throw new Error(`Failed to execute data code: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Summarize the result using LLM
    progress({ phase: STEP_PHASE.SUMMARIZE, params: { status: 'running' } });
    const summary = await this.summarizeResult(query, analysisData);
    progress({ phase: STEP_PHASE.SUMMARIZE, params: { status: 'done', detail: summary.slice(0, 200) } });

    // Detect visualization intent and generate visualization if needed
    let visualizationHTML: string | undefined;
    let visualizationSyntax: string | undefined;
    try {
      progress({ phase: STEP_PHASE.ADVISOR, params: { status: 'running' } });
      // adviseChartType uses describeData which handles any data format
      const chartType = await adviseChartType(query, analysisData, this.llmConfig);
      progress({ phase: STEP_PHASE.ADVISOR, params: { status: 'done', detail: chartType || 'No visualization needed' } });

      if (chartType && hasData(analysisData)) {
        // generateVisualizationHTML uses JSON.stringify which handles any JSON-serializable data
        progress({ phase: STEP_PHASE.VISUALIZE, params: { status: 'running' } });
        const result = await generateVisualizationHTML(chartType, analysisData, query, this.llmConfig);
        visualizationSyntax = result.syntax;
        visualizationHTML = result.html;
        progress({
          phase: STEP_PHASE.VISUALIZE,
          params: {
            status: 'done',
            detail: visualizationSyntax ? visualizationSyntax.slice(0, 200) : '',
          },
        });
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
    if (this.sqliteStore) {
      this.sqliteStore.close();
      this.sqliteStore = null;
    }
    this.data = null;
    this.dataInfo = null;
  }
}
