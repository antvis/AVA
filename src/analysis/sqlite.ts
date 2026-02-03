/**
 * SQLite database wrapper for large datasets
 * Note: This module requires 'better-sqlite3' which is Node.js-only.
 * In browser environments, it will gracefully fail with helpful error messages.
 */

type Database = any;

export class SQLiteDataStore {
  private db: Database | null = null;
  private readonly tableName: string = 'data';
  private readonly dbPath: string;

  constructor(dbPath: string = ':memory:') {
    this.dbPath = dbPath;
  }

  /**
   * Initialize the database (lazy loading)
   */
  private async initDb(): Promise<void> {
    if (this.db) return;
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      throw new Error('SQLite is not supported in browser environments. Please reduce data size or use in-memory processing.');
    }
    
    try {
      // Dynamic import for Node.js-only module
      const Database = (await import('better-sqlite3')).default;
      this.db = new Database(this.dbPath);
    } catch (error) {
      throw new Error(
        `Failed to load better-sqlite3. This module is only available in Node.js environments: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load data into SQLite table
   */
  async loadData(data: any[]): Promise<void> {
    await this.initDb();
    if (!this.db || !data || data.length === 0) return;

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
  async query(sql: string): Promise<any[]> {
    await this.initDb();
    if (!this.db) return [];
    return this.db.prepare(sql).all();
  }

  /**
   * Get schema info
   */
  async getSchema(): Promise<string> {
    await this.initDb();
    if (!this.db) return '';
    const result = this.db.prepare(`PRAGMA table_info(${this.tableName})`).all();
    return result.map((col: any) => `${col.name} (${col.type})`).join(', ');
  }

  /**
   * Close database
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
