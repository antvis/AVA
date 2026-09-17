/**
 * DuckDB engine: LLM generates SQL, executed against an in-memory DuckDB instance.
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { DuckDBInstance } from '@duckdb/node-api';

import { coerceNumbers } from '../util/coerce';
import { mapFieldType, stringifySchema } from '../util/schema';
import { READ_FN, escapeSql } from '../util/sql';

import { loadSource } from './loaders';

import type { DuckDBConnection } from '@duckdb/node-api';
import type {
  AnalysisEngine,
  DataSourceConfig,
  Schema,
  FieldMetadata,
  FileFormat,
  LLMConfig,
} from '../types';

export class DuckDBEngine implements AnalysisEngine {
  private instance: DuckDBInstance | null = null;
  private connection: DuckDBConnection | null = null;
  private readonly tableName: string = 'data';
  private cleanup: (() => Promise<void>) | null = null;

  constructor(private readonly llmConfig: LLMConfig) {}

  /**
   * Get or create the DuckDB connection (lazy loading)
   */
  private async getConnection(): Promise<DuckDBConnection> {
    if (this.connection) return this.connection;

    this.instance = await DuckDBInstance.create(':memory:');
    this.connection = await this.instance.connect();
    return this.connection;
  }

  /**
   * Register a local file as the `data` view (csv/json/parquet).
   * The view reads the file lazily, so the file must outlive the engine.
   */
  private async registerFile(filePath: string, format: FileFormat): Promise<void> {
    const conn = await this.getConnection();
    const sniff = format === 'parquet' ? '' : ', auto_detect=true';
    await conn.run(
      `CREATE OR REPLACE VIEW ${this.tableName} AS SELECT * FROM ${READ_FN[format]}('${escapeSql(filePath)}'${sniff})`
    );
  }

  async load(config: DataSourceConfig): Promise<Schema> {
    try {
      const source = await loadSource(config, this.llmConfig);
      await this.registerFile(source.path, source.format);
      this.cleanup = source.cleanup;
    } catch (error) {
      await this.cleanup?.();
      this.cleanup = null;
      this.close();
      throw error;
    }

    return this.getSchema();
  }

  async getDSL(query: string): Promise<string> {
    const schema = stringifySchema(await this.getSchema());

    const openai = createOpenAI({
      apiKey: this.llmConfig.apiKey,
      baseURL: this.llmConfig.baseURL,
    });

    const prompt = `You are a SQL expert. Given the following table schema and user query, generate a SQL query to answer the question.

Table Schema:
${schema}

User Query: ${query}

Generate ONLY the SQL query without any explanation or markdown formatting. The table name is "data". Use DuckDB SQL syntax.`;

    const { text } = await generateText({
      model: openai(this.llmConfig.model) as any,
      prompt,
    });

    // Strip markdown code fences the model may wrap around the SQL
    return text.trim().replace(/^```(?:sql)?\s*|\s*```$/gi, '').trim();
  }

  async execute(sql: string): Promise<any> {
    const conn = await this.getConnection();
    const reader = await conn.runAndReadAll(sql);
    return coerceNumbers(reader.getRowObjectsJson());
  }

  /**
   * Derive the dataset schema from DuckDB without materializing the data.
   * Returns an empty schema when no table exists (e.g. empty data registered).
   */
  private async getSchema(): Promise<Schema> {
    const conn = await this.getConnection();

    const exists = await conn.runAndReadAll(
      `SELECT 1 FROM information_schema.tables WHERE table_name = '${this.tableName}'`
    );
    if (exists.getRowObjectsJson().length === 0) {
      return { rowCount: 0, columnCount: 0, fields: [] };
    }

    const colsReader = await conn.runAndReadAll(`DESCRIBE ${this.tableName}`);
    const cols = colsReader.getRowObjectsJson();

    const countReader = await conn.runAndReadAll(`SELECT COUNT(*) AS c FROM ${this.tableName}`);
    const rowCount = Number(countReader.getRowObjectsJson()[0]?.c ?? 0);

    const sampleReader = await conn.runAndReadAll(`SELECT * FROM ${this.tableName} LIMIT 5`);
    const sampleRows = coerceNumbers(sampleReader.getRowObjectsJson());

    const fields: FieldMetadata[] = cols.map((col: any) => ({
      name: col.column_name,
      type: mapFieldType(String(col.column_type)),
      rawType: String(col.column_type),
      samples: sampleRows.map((row) => row[col.column_name]).filter((v) => v != null),
    }));

    return {
      rowCount,
      columnCount: fields.length,
      fields,
    };
  }

  /**
   * Close the database connection and instance
   */
  private close(): void {
    try {
      this.connection?.closeSync();
      this.instance?.closeSync();
    } catch {
      // already closed
    }
    this.connection = null;
    this.instance = null;
  }

  async dispose(): Promise<void> {
    this.close();
    await this.cleanup?.();
    this.cleanup = null;
  }
}
