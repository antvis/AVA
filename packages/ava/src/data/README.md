# Data Module

The data module is responsible for loading and processing data from various sources.

## Features

- **CSV Loading**: Load CSV files with automatic type inference
- **Metadata Extraction**: Automatically extract field types, unique values, null counts
- **Format Conversion**: Convert data for LLM context or database storage

## API

### `loadCSV(filePath: string): Promise<any[]>`

Loads a CSV file and returns the parsed data as an array of objects.

```typescript
import { loadCSV } from '@antv/ava';

const data = await loadCSV('data/companies.csv');
```

### `extractMetadata(data: any[]): DatasetInfo`

Extracts metadata from the data including row count, column count, field types, and size.

```typescript
import { extractMetadata } from '@antv/ava';

const metadata = extractMetadata(data);
console.log(metadata.rowCount); // 100
console.log(metadata.fields); // [{ name: 'region', type: 'string', ... }]
```

### `formatDatasetInfo(info: DatasetInfo): string`

Formats dataset information as a human-readable string suitable for LLM context.

```typescript
import { formatDatasetInfo } from '@antv/ava';

const infoString = formatDatasetInfo(metadata);
console.log(infoString);
// Dataset Info:
// - Rows: 100
// - Columns: 3
// ...
```

## Type Inference

The module automatically infers field types based on the data:

- **number**: All non-null values are numeric
- **boolean**: Values are true/false
- **date**: Values can be parsed as dates
- **string**: Default fallback type
