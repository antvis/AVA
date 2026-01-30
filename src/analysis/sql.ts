/**
 * SQL-related functionality for data analysis
 */

import Database from 'better-sqlite3';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { LLMConfig } from '../types';

/**
 * SQLite database wrapper for large datasets
 */
export class SQLiteDataStore {
  private readonly db: Database.Database;
  private readonly tableName: string = 'data';

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
  }

  /**
   * Load data into SQLite table
   */
  loadData(data: any[]): void {
    if (!data || data.length === 0) return;

    // Create table from first row
    const columns = Object.keys(data[0]);
    const columnDefs = columns.map(col => `"${col}" TEXT`).join(', ');
    
    this.db.exec(`DROP TABLE IF EXISTS ${this.tableName}`);
    this.db.exec(`CREATE TABLE ${this.tableName} (${columnDefs})`);

    // Insert data
    const placeholders = columns.map(() => '?').join(', ');
    const insert = this.db.prepare(
      `INSERT INTO ${this.tableName} VALUES (${placeholders})`
    );

    const insertMany = this.db.transaction((rows: any[]) => {
      for (const row of rows) {
        const values = columns.map(col => {
          const val = row[col];
          return val == null ? null : String(val);
        });
        insert.run(...values);
      }
    });

    insertMany(data);
  }

  /**
   * Execute SQL query
   */
  query(sql: string): any[] {
    return this.db.prepare(sql).all();
  }

  /**
   * Get schema info
   */
  getSchema(): string {
    const result = this.db.prepare(`PRAGMA table_info(${this.tableName})`).all();
    return result.map((col: any) => `${col.name} (${col.type})`).join(', ');
  }

  /**
   * Close database
   */
  close(): void {
    this.db.close();
  }
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

Generate ONLY the SQL query without any explanation or markdown formatting. The table name is "data".`;

  const { text } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  // Clean up the SQL - remove markdown code blocks if present
  const sql = text.trim().replace(/^```(?:sql)?\s*|\s*```$/gi, '');
  
  return sql.trim();
}
