/**
 * DuckDB engine: LLM generates SQL, executed against an in-memory DuckDB instance.
 * Node.js only; supports inline data and local/remote files (csv/json/parquet).
 * Data is exposed as a table/view named "data".
 * Note: This engine requires '@duckdb/node-api', which is Node.js-only.
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { AnalysisEngine, DataSource, DatasetInfo, FieldMetadata, LLMConfig, SourceFormat } from '../types';

type DuckDBInstance = any;
type DuckDBConnection = any;

const READ_FN: Record<SourceFormat, string> = {
  csv: 'read_csv',
  json: 'read_json',
  parquet: 'read_parquet',
};

/** Escape a string for safe embedding in a SQL string literal */
function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * DuckDB JSON rows serialize BIGINT/DECIMAL as strings — coerce numeric strings
 * back to numbers. Strings with leading zeros ("007") are left untouched.
 */
function coerceNumbers(rows: any[]): any[] {
  return rows.map((row) => {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = typeof value === 'string' && /^-?(0|[1-9]\d*)(\.\d+)?$/.test(value) ? Number(value) : value;
    }
    return out;
  });
}

/** Map DuckDB column types to AVA field types */
function mapFieldType(columnType: string): FieldMetadata['type'] {
  const t = columnType.toUpperCase();
  if (/INT|DOUBLE|FLOAT|REAL|DECIMAL|NUMERIC/.test(t)) return 'number';
  if (/BOOL/.test(t)) return 'boolean';
  if (/DATE|TIME/.test(t)) return 'date';
  return 'string';
}

/**
 * Generate SQL query from natural language using LLM
 */
export async function generateSQL(
  llmConfig: LLMConfig,
  schema: string,
  query: string
): Promise<string> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const prompt = `You are a SQL expert. Given the following table schema and user query, generate a SQL query to answer the question.

Table Schema:
${schema}

User Query: ${query}

Generate ONLY the SQL query without any explanation or markdown formatting. The table name is "data". Use DuckDB SQL syntax.`;

  const { text } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  // Clean up the SQL - remove markdown code blocks if present
  const sql = text.trim().replace(/^```(?:sql)?\s*|\s*```$/gi, '');

  return sql.trim();
}

export class DuckDBStore {
  private instance: DuckDBInstance | null = null;
  private connection: DuckDBConnection | null = null;
  private readonly tableName: string = 'data'; // Fixed table name, not user-controllable

  /**
   * Get or create the DuckDB connection (lazy loading)
   */
  private async getConnection(): Promise<DuckDBConnection> {
    if (this.connection) return this.connection;

    if (typeof window !== 'undefined') {
      throw new Error('DuckDB is not supported in browser environments.');
    }

    try {
      const { DuckDBInstance } = await import('@duckdb/node-api');
      this.instance = await DuckDBInstance.create(':memory:');
      this.connection = await this.instance.connect();
      return this.connection;
    } catch (error) {
      throw new Error(
        `Failed to initialize DuckDB. This module is only available in Node.js environments: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Register an in-memory array as the `data` table.
   * Goes through a temp JSON file so DuckDB infers proper column types.
   */
  async registerData(data: any[]): Promise<void> {
    if (!data || data.length === 0) return;
    const conn = await this.getConnection();

    const os = await import('os');
    const path = await import('path');
    const fs = await import('fs/promises');
    const tmpFile = path.join(os.tmpdir(), `ava-data-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);

    await fs.writeFile(tmpFile, JSON.stringify(data));
    try {
      await conn.run(
        `CREATE OR REPLACE TABLE ${this.tableName} AS SELECT * FROM read_json('${escapeSql(tmpFile)}', auto_detect=true)`
      );
    } finally {
      await fs.unlink(tmpFile).catch(() => {});
    }
  }

  /**
   * Register a local file as the `data` view (csv/json/parquet).
   * The view reads the file lazily, so the file must outlive the store.
   */
  async registerFile(filePath: string, format: SourceFormat): Promise<void> {
    const conn = await this.getConnection();
    const sniff = format === 'parquet' ? '' : ', auto_detect=true';
    await conn.run(
      `CREATE OR REPLACE VIEW ${this.tableName} AS SELECT * FROM ${READ_FN[format]}('${escapeSql(filePath)}'${sniff})`
    );
  }

  /**
   * Execute SQL query against the `data` table
   */
  async query(sql: string): Promise<any[]> {
    const conn = await this.getConnection();
    const reader = await conn.runAndReadAll(sql);
    return coerceNumbers(reader.getRowObjectsJson());
  }

  /**
   * Get schema info for LLM prompts, e.g. "name (VARCHAR), age (BIGINT)"
   */
  async getSchema(): Promise<string> {
    const conn = await this.getConnection();
    // DESCRIBE throws when the table doesn't exist (e.g. empty data registered)
    const exists = await conn.runAndReadAll(
      `SELECT 1 FROM information_schema.tables WHERE table_name = '${this.tableName}'`
    );
    if (exists.getRowObjectsJson().length === 0) return '';
    const reader = await conn.runAndReadAll(`DESCRIBE ${this.tableName}`);
    return reader
      .getRowObjectsJson()
      .map((col: any) => `${col.column_name} (${col.column_type})`)
      .join(', ');
  }

  /**
   * Derive dataset metadata from DuckDB without materializing the data.
   * sizeInBytes is a rough estimate — the data itself lives in DuckDB.
   */
  async getDatasetInfo(): Promise<DatasetInfo> {
    const conn = await this.getConnection();

    const colsReader = await conn.runAndReadAll(`DESCRIBE ${this.tableName}`);
    const cols = colsReader.getRowObjectsJson();

    const countReader = await conn.runAndReadAll(`SELECT COUNT(*) AS c FROM ${this.tableName}`);
    const rowCount = Number(countReader.getRowObjectsJson()[0]?.c ?? 0);

    const sampleReader = await conn.runAndReadAll(`SELECT * FROM ${this.tableName} LIMIT 5`);
    const sampleRows = coerceNumbers(sampleReader.getRowObjectsJson());

    const fields: FieldMetadata[] = cols.map((col: any) => ({
      name: col.column_name,
      type: mapFieldType(String(col.column_type)),
      samples: sampleRows.map((row) => row[col.column_name]).filter((v) => v != null),
    }));

    return {
      rowCount,
      columnCount: fields.length,
      fields,
      sizeInBytes: rowCount * fields.length * 32,
    };
  }

  /**
   * Close database
   */
  close(): void {
    try {
      this.connection?.closeSync();
      this.instance?.closeSync();
    } catch {
      // already closed
    }
    this.connection = null;
    this.instance = null;
  }
}

export class DuckDBEngine implements AnalysisEngine {
  private store: DuckDBStore | null = null;
  private cleanup: (() => Promise<void>) | null = null;

  constructor(private readonly llmConfig: LLMConfig) {}

  async load(source: DataSource): Promise<DatasetInfo> {
    if (typeof window !== 'undefined') {
      throw new Error('The duckdb engine is only available in Node.js. Use engine: "code" in browser.');
    }

    this.store = new DuckDBStore();
    try {
      if (source.kind === 'file') {
        await this.store.registerFile(source.path, source.format);
        this.cleanup = source.cleanup ?? null;
      } else {
        await this.store.registerData(source.data);
      }
    } catch (error) {
      if (source.kind === 'file') {
        await source.cleanup?.();
      }
      this.store = null;
      throw error;
    }

    return this.store.getDatasetInfo();
  }

  async getDSL(query: string): Promise<string> {
    if (!this.store) {
      throw new Error('No data loaded.');
    }
    return generateSQL(this.llmConfig, await this.store.getSchema(), query);
  }

  async execute(sql: string): Promise<any> {
    if (!this.store) {
      throw new Error('No data loaded.');
    }
    return this.store.query(sql);
  }

  async dispose(): Promise<void> {
    this.store?.close();
    this.store = null;
    await this.cleanup?.();
    this.cleanup = null;
  }
}
