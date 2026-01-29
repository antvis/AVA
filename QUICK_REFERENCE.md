# AVA v4 Quick Reference

## Installation

```bash
cd packages/ava
npm install --ignore-scripts
npm run build
```

## Basic Usage

```typescript
import { AVA } from '@antv/ava';

// 1. Initialize
const ava = new AVA({
  llm: {
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
  },
});

// 2. Load data
await ava.loadCSV('path/to/data.csv');

// 3. Ask questions
const answer = await ava.analysis('Your question here');
console.log(answer);

// 4. Clean up
ava.dispose();
```

## API Reference

### Constructor

```typescript
new AVA(config: AVAConfig)
```

**Config Options:**
- `llm.model` - Model name (e.g., 'gpt-4', 'gpt-3.5-turbo')
- `llm.apiKey` - Your API key
- `llm.baseURL` (optional) - Custom API endpoint
- `sqliteThreshold` (optional) - Size threshold for SQLite (default: 10KB)

### Methods

#### `loadCSV(filePath: string): Promise<void>`
Load a CSV file for analysis.

#### `analysis(query: string): Promise<string>`
Analyze data using natural language query.

#### `dispose(): void`
Clean up resources (close DB, free memory).

## Example Queries

```typescript
// Aggregations
await ava.analysis('What is the average revenue?');
await ava.analysis('Show me the sum of sales by region');
await ava.analysis('What is the max temperature by month?');

// Filtering
await ava.analysis('Which customers have revenue over $100,000?');
await ava.analysis('Show products with rating above 4.5');

// Sorting & Top N
await ava.analysis('Show top 10 companies by revenue');
await ava.analysis('List the 5 highest scored items');

// Grouping
await ava.analysis('Count users by country');
await ava.analysis('Average price per category');
```

## Advanced Configuration

### Custom Model Provider

```typescript
const ava = new AVA({
  llm: {
    model: 'custom-model',
    apiKey: process.env.API_KEY,
    baseURL: 'https://your-api.com/v1',
  },
});
```

### Custom SQLite Threshold

```typescript
const ava = new AVA({
  llm: {
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY,
  },
  sqliteThreshold: 50 * 1024, // 50KB
});
```

## Data Format

CSV files should have headers:

```csv
name,age,city,salary
John,30,NYC,75000
Jane,25,LA,80000
Bob,35,Chicago,70000
```

## Error Handling

```typescript
try {
  await ava.loadCSV('data.csv');
  const result = await ava.analysis('Your query');
  console.log(result);
} catch (error) {
  console.error('Error:', error.message);
} finally {
  ava.dispose();
}
```

## Environment Variables

```bash
export OPENAI_API_KEY='sk-...'
```

Or use `.env` file:
```
OPENAI_API_KEY=sk-...
```

## TypeScript Types

```typescript
import type {
  AVAConfig,
  LLMConfig,
  DatasetInfo,
  FieldMetadata,
} from '@antv/ava';
```

## Common Issues

### Issue: "No data loaded"
**Solution**: Make sure to call `loadCSV()` before `analysis()`

### Issue: Network timeout
**Solution**: Check your internet connection and API key

### Issue: CSV parsing error
**Solution**: Ensure CSV has proper headers and encoding (UTF-8)

## File Size Limits

- **<10KB**: Uses JavaScript in-memory operations (fast)
- **≥10KB**: Automatically uses SQLite (efficient for large data)

## Supported Operations

The analysis module can handle:
- ✅ Aggregations (sum, avg, max, min, count)
- ✅ Filtering (where conditions)
- ✅ Grouping (group by)
- ✅ Sorting (order by)
- ✅ Top N queries
- ✅ Basic calculations

## Development

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Format
```bash
npm run format
```

## Resources

- [Main README](./packages/ava/README.md)
- [Architecture Guide](./AI_BRANCH_README.md)
- [v3 vs v4 Comparison](./V3_VS_V4_COMPARISON.md)
- [Examples](./examples/)

## Support

For issues and questions:
- GitHub Issues: https://github.com/antvis/AVA/issues
- Documentation: See README files in each module

## License

MIT
