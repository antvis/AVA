/**
 * Analysis module for data querying and analysis
 */

// Re-export SQLite data store (Node.js only)
export { SQLiteDataStore } from './sqlite';

// Re-export IndexedDB data store (Browser only)
export { IndexedDBDataStore } from './indexeddb';

// Re-export SQL-related functionality
export { generateSQL } from './sql';

// Re-export code execution functionality
export { executeDataCode, generateDataCode } from './code';
