/**
 * IndexedDB data store for browser environments
 * Provides persistent storage for large datasets in the browser
 */

/* eslint-env browser */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// Data row with auto-generated __id from IndexedDB
interface DataRow {
  __id?: number;
  [key: string]: unknown;
}

// Metadata entry structure
interface MetadataEntry {
  key: string;
  value: unknown;
}

interface AVADBSchema extends DBSchema {
  data: {
    key: number;
    value: DataRow;
  };
  metadata: {
    key: string;
    value: MetadataEntry;
  };
}

export class IndexedDBDataStore {
  private db: IDBPDatabase<AVADBSchema> | null = null;
  private readonly dbName: string = 'AVADataStore';
  private readonly version: number = 1;
  private batchSize: number = 1000;

  /**
   * Initialize the IndexedDB database
   */
  private async initDB(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<AVADBSchema>(this.dbName, this.version, {
      upgrade(db) {
        // Store for actual data rows
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: '__id', autoIncrement: true });
        }
        // Store for metadata (row count, fields, etc.)
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      },
    });
  }

  /**
   * Load data into IndexedDB
   * Uses batch processing to avoid transaction timeouts with large datasets
   */
  async loadData(data: any[]): Promise<void> {
    await this.initDB();
    if (!data || data.length === 0) return;

    // Check storage quota (best effort)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const dataSize = new Blob([JSON.stringify(data)]).size;
        if (estimate.usage && estimate.quota && estimate.usage + dataSize > estimate.quota * 0.9) {
          throw new Error('Storage quota exceeded. Data size exceeds available storage space.');
        }
      } catch (e) {
        // Ignore estimation errors, proceed with attempt
      }
    }

    // Clear existing data first
    await this.clear();

    // Extract fields from first row
    const fields = Object.keys(data[0]);

    // Store metadata
    await this.db!.put('metadata', { key: 'fields', value: fields });
    await this.db!.put('metadata', { key: 'rowCount', value: data.length });

    // Batch insert to avoid transaction timeout
    const totalBatches = Math.ceil(data.length / this.batchSize);

    try {
      for (let i = 0; i < totalBatches; i++) {
        const start = i * this.batchSize;
        const end = Math.min(start + this.batchSize, data.length);
        const batch = data.slice(start, end);

        const tx = this.db!.transaction('data', 'readwrite');
        const store = tx.objectStore('data');

        for (const row of batch) {
          // Remove __id if exists to avoid conflicts with auto-increment keyPath
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { __id: _unused, ...cleanRow } = row;
          store.put(cleanRow);
        }

        await tx.done;
      }
    } catch (error) {
      // Clean up partial data on failure
      await this.clear().catch(() => {});
      throw new Error(
        `Failed to load data into IndexedDB: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all data from IndexedDB
   * Note: This loads all data into memory, suitable for analysis queries
   * Returns data without the internal __id field
   */
  async getAllData(): Promise<Record<string, unknown>[]> {
    await this.initDB();
    return this.db!.getAll('data');
  }

  /**
   * Get the number of rows stored
   */
  async getCount(): Promise<number> {
    await this.initDB();
    const count = await this.db!.count('data');
    return count;
  }

  /**
   * Get stored row count from metadata (faster than counting)
   */
  async getRowCount(): Promise<number> {
    await this.initDB();
    const meta = await this.db!.get('metadata', 'rowCount');
    return (meta?.value as number) || 0;
  }

  /**
   * Get field names from metadata
   */
  async getFields(): Promise<string[]> {
    await this.initDB();
    const meta = await this.db!.get('metadata', 'fields');
    return (meta?.value as string[]) || [];
  }

  /**
   * Get schema information for LLM context
   */
  async getSchema(): Promise<string> {
    const fields = await this.getFields();
    const count = await this.getRowCount();

    if (fields.length === 0) {
      return 'No data available';
    }

    // Sample a few rows to infer types
    const sample = await this.getSample(5);
    const fieldTypes = fields.map(field => {
      const values = sample.map(row => row[field]).filter(v => v != null);
      const type = this.inferType(values);
      return `${field} (${type})`;
    });

    return `Table: data (${count} rows)\nFields: ${fieldTypes.join(', ')}`;
  }

  /**
   * Get a sample of rows for schema inference
   * Returns raw rows including __id for internal use
   */
  private async getSample(count: number): Promise<DataRow[]> {
    await this.initDB();
    const allData = await this.db!.getAll('data', undefined, count);
    return allData;
  }

  /**
   * Infer field type from sample values
   */
  private inferType(values: Array<unknown>): string {
    if (values.length === 0) return 'unknown';

    const allNumbers = values.every(v => typeof v === 'number' || !Number.isNaN(Number(v)));
    if (allNumbers) return 'number';

    const allDates = values.every(v => {
      if (typeof v === 'string') {
        const date = new Date(v);
        return !Number.isNaN(date.getTime());
      }
      return false;
    });
    if (allDates) return 'date';

    const allBooleans = values.every(v =>
      typeof v === 'boolean' || v === 'true' || v === 'false'
    );
    if (allBooleans) return 'boolean';

    return 'string';
  }

  /**
   * Clear all data from the store
   */
  async clear(): Promise<void> {
    await this.initDB();
    await this.db!.clear('data');
    await this.db!.clear('metadata');
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Delete the entire database (useful for cleanup)
   */
  async deleteDatabase(): Promise<void> {
    this.close();
    await indexedDB.deleteDatabase(this.dbName);
  }
}
