# Analysis Module

The analysis module handles data querying and analysis using either danfojs for small datasets or SQLite for large datasets.

## Features

- **SQLite Integration**: Automatic storage for large datasets (>10KB)
- **Danfojs Support**: In-memory analysis for small datasets
- **Natural Language to Code**: Generate SQL or danfojs code from user queries
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

### `executeDataframeCode(data: any[], code: string): Promise<any>`

Executes danfojs code against the data.

```typescript
import { executeDataframeCode } from '@antv/ava';

const code = `
  const result = df.groupby(['region']).col(['revenue']).mean();
`;
const result = await executeDataframeCode(data, code);
```

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

### `generateDataframeCode(llmConfig: LLMConfig, dataInfo: string, query: string): Promise<string>`

Generates danfojs code from natural language using LLM.

```typescript
import { generateDataframeCode } from '@antv/ava';

const code = await generateDataframeCode(
  { model: 'gpt-4', apiKey: 'your-key' },
  dataInfoString,
  'What is the average revenue by region?'
);
// Returns: const result = df.groupby(['region']).col(['revenue']).mean();
```

## Data Size Threshold

- **Small Data (<10KB)**: Uses danfojs for in-memory analysis
- **Large Data (≥10KB)**: Uses SQLite for efficient querying

The threshold is configurable via `AVAConfig.sqliteThreshold`.
