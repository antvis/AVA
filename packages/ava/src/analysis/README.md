# Analysis Module

The analysis module handles data querying and analysis using either JavaScript operations for small datasets or SQLite for large datasets.

## Features

- **SQLite Integration**: Automatic storage for large datasets (>10KB)
- **JavaScript Operations**: In-memory analysis for small datasets with helper functions
- **Natural Language to Code**: Generate SQL or JavaScript code from user queries
- **Code Execution**: Safe execution of generated code

## API

### `SQLiteDataStore`

A wrapper class for SQLite database operations.

```typescript
import { SQLiteDataStore } from '@antv/ava';

const store = new SQLiteDataStore(':memory:');
store.loadData(data);
const results = store.query('SELECT * FROM data WHERE revenue > 1000');
store.close();
```

#### Methods

- `loadData(data: any[]): void` - Load data into SQLite table
- `query(sql: string): any[]` - Execute SQL query
- `getSchema(): string` - Get table schema information
- `close(): void` - Close database connection

### `executeDataCode(data: any[], code: string): Promise<any>`

Executes JavaScript code against the data with helper operations.

```typescript
import { executeDataCode } from '@antv/ava';

const code = `
  const grouped = ops.groupBy(data, 'region');
  const result = Object.keys(grouped).map(region => ({
    region,
    avgRevenue: ops.avg(grouped[region], 'revenue')
  }));
`;
const result = await executeDataCode(data, code);
```

#### Available Operations

The `ops` object provides helper functions:
- `groupBy(arr, key)` - Group array by key
- `sum(arr, key)` - Sum values by key
- `avg(arr, key)` - Average values by key
- `max(arr, key)` - Maximum value by key
- `min(arr, key)` - Minimum value by key
- `count(arr)` - Count items
- `sortBy(arr, key, order)` - Sort array by key

### `generateSQL(llmConfig: LLMConfig, schema: string, query: string): Promise<string>`

Generates SQL query from natural language using LLM.

```typescript
import { generateSQL } from '@antv/ava';

const sql = await generateSQL(
  { model: 'gpt-4', apiKey: 'your-key' },
  'region TEXT, revenue TEXT',
  'What is the average revenue by region?'
);
// Returns: SELECT region, AVG(CAST(revenue AS REAL)) as avg_revenue FROM data GROUP BY region
```

### `generateDataCode(llmConfig: LLMConfig, dataInfo: string, query: string): Promise<string>`

Generates JavaScript code from natural language using LLM.

```typescript
import { generateDataCode } from '@antv/ava';

const code = await generateDataCode(
  { model: 'gpt-4', apiKey: 'your-key' },
  dataInfoString,
  'What is the average revenue by region?'
);
// Returns JavaScript code using helper operations
```

## Data Size Threshold

- **Small Data (<10KB)**: Uses JavaScript helper functions for in-memory analysis
- **Large Data (≥10KB)**: Uses SQLite for efficient querying

The threshold is configurable via `AVAConfig.sqliteThreshold`.
