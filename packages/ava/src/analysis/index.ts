/**
 * Analysis module for data querying and analysis
 */

import Database from 'better-sqlite3';
import * as dfd from 'danfojs-node';
import { generateText } from 'ai';
import type { LLMConfig } from '../types';

/**
 * SQLite database wrapper for large datasets
 */
export class SQLiteDataStore {
  private db: Database.Database;
  private tableName: string = 'data';

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
 * Generate and execute code for data analysis using danfojs
 */
export async function executeDataframeCode(
  data: any[],
  code: string
): Promise<any> {
  try {
    // Create DataFrame
    const df = new dfd.DataFrame(data);
    
    // Execute code in a safe context
    // Note: In production, you should use a proper sandbox
    const func = new Function('dfd', 'df', `
      ${code}
      return result;
    `);
    
    const result = func(dfd, df);
    
    // Convert result to plain object/array
    if (result && typeof result.values === 'object') {
      return result.values;
    }
    
    return result;
  } catch (error) {
    throw new Error(`Failed to execute dataframe code: ${error instanceof Error ? error.message : String(error)}`);
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
  const { createOpenAI } = await import('@ai-sdk/openai');
  
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
    model: openai(llmConfig.model),
    prompt,
  });

  // Clean up the SQL
  let sql = text.trim();
  // Remove markdown code blocks if present
  sql = sql.replace(/^```sql\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
  
  return sql.trim();
}

/**
 * Generate danfojs code from natural language using LLM
 */
export async function generateDataframeCode(
  llmConfig: LLMConfig,
  dataInfo: string,
  query: string
): Promise<string> {
  const { createOpenAI } = await import('@ai-sdk/openai');
  
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const prompt = `You are a data analysis expert using danfojs (similar to pandas). Given the following dataset information and user query, generate JavaScript code using danfojs to answer the question.

Dataset Information:
${dataInfo}

User Query: ${query}

Generate ONLY the JavaScript code without any explanation. Use the variable "df" which is already a danfojs DataFrame. Store the final result in a variable named "result". Do not use console.log or print statements.

Example:
const result = df.groupby(['region']).col(['revenue']).mean();

Now generate the code:`;

  const { text } = await generateText({
    model: openai(llmConfig.model),
    prompt,
  });

  // Clean up the code
  let code = text.trim();
  // Remove markdown code blocks if present
  code = code.replace(/^```javascript\s*/i, '').replace(/^```js\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
  
  return code.trim();
}
