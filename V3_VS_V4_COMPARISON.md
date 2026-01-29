# AVA v3 vs v4 Comparison

## Fundamental Differences

| Aspect | AVA v3 | AVA v4 |
|--------|---------|---------|
| **Approach** | Rule-based analytics | AI-native with LLMs |
| **Primary Use** | Automated chart recommendation, insights | Natural language data analysis |
| **Core Technology** | Statistical algorithms, predefined rules | Large Language Models (GPT-4, etc.) |
| **Data Processing** | @antv/data, custom processors | CSV parsing + SQLite/JavaScript |
| **Chart Generation** | Based on CKB (Chart Knowledge Base) | AI-powered (coming soon) |
| **Code Size** | ~10,000+ lines | ~344 lines (core) |
| **Dependencies** | Many (G2, algorithms, etc.) | Minimal (AI SDK, SQLite, CSV parser) |

## API Comparison

### v3 API

```typescript
import { DataFrame, getInsights, ckb, Advisor } from '@antv/ava';

const data = [
  { price: 38, type: 'A' },
  { price: 52, type: 'B' },
];

// Data processing
const df = new DataFrame(data);

// Insights
const { insights } = getInsights(data);

// Chart recommendation
const chartAdvisor = new Advisor();
const results = chartAdvisor.advise({ data });
```

### v4 API

```typescript
import { AVA } from '@antv/ava';

const ava = new AVA({
  llm: {
    model: 'gpt-4',
    apiKey: 'YOUR_API_KEY',
  },
});

// Load data
await ava.loadCSV('data.csv');

// Natural language analysis
const result = await ava.analysis('What is the average price by type?');
```

## Feature Comparison

### v3 Features

✅ **Data Processing**
- DataFrame manipulation
- Statistical calculations
- Data transformation

✅ **Insight Detection**
- Trend detection
- Outlier identification
- Correlation analysis
- Category outliers
- Time series anomalies

✅ **Chart Knowledge Base (CKB)**
- 50+ chart types
- Design rules and guidelines
- Chart ranking algorithms

✅ **Chart Advisor**
- Automatic chart type selection
- Chart optimization
- Specification generation

### v4 Features

✅ **Natural Language Interface**
- Ask questions in plain English
- No need to know specific APIs

✅ **Intelligent Data Analysis**
- LLM-powered query understanding
- Automatic code/SQL generation
- Context-aware responses

✅ **Smart Data Handling**
- Automatic size-based optimization
- In-memory for small data
- SQLite for large data

🚧 **AI-Powered Visualization** (Coming Soon)
- Natural language chart requests
- AI-based chart recommendations
- Automatic spec generation

## When to Use Each Version

### Use AVA v3 When:

- You need **rule-based, deterministic** insights
- You want to **avoid LLM costs** (no API calls)
- You need **extensive chart knowledge base**
- You want **offline capabilities**
- You need **fine-grained control** over algorithms
- You're building **traditional BI dashboards**

### Use AVA v4 When:

- You want **natural language interface**
- You're okay with **LLM API costs**
- You need **flexible, conversational** analysis
- You want **minimal code** to get started
- You have **varying data analysis needs**
- You're building **AI-powered applications**

## Migration Guide

### Cannot Directly Migrate

AVA v4 is a **complete rewrite** with a different philosophy. There is no direct migration path. Instead, consider:

1. **Evaluate your needs**: Does your use case benefit from AI-native approach?
2. **Prototype with v4**: Try v4 for new features
3. **Gradual adoption**: Use both versions for different features
4. **Rebuild with v4**: For greenfield projects, start with v4

### Example: Converting v3 Insight to v4 Query

**v3 Code:**
```typescript
const { insights } = getInsights(data, {
  measures: [{ field: 'revenue', method: 'MEAN' }],
  dimensions: [{ field: 'region' }],
});
```

**v4 Equivalent:**
```typescript
const result = await ava.analysis('What is the average revenue by region?');
```

## Performance Considerations

### v3 Performance
- ✅ Fast (no network calls)
- ✅ Consistent execution time
- ✅ Low latency
- ❌ More CPU for complex algorithms

### v4 Performance
- ❌ Depends on LLM response time (1-5s typical)
- ❌ Network latency
- ✅ Less CPU usage (LLM does the work)
- ✅ Better for large datasets (SQLite)

## Cost Considerations

### v3 Costs
- **Free** - No API calls
- Infrastructure costs only

### v4 Costs
- **LLM API costs** per query
- Typical: $0.001-0.03 per query (depending on model)
- Consider caching strategies

## Development Experience

### v3
- More code to write
- Need to learn specific APIs
- Predictable behavior
- Extensive documentation

### v4
- Less code to write
- Natural language interface
- LLM behavior can vary
- Simpler getting started

## Summary

**AVA v3**: Mature, feature-rich, rule-based analytics framework. Best for traditional BI, offline use, and when you need deterministic results.

**AVA v4**: Modern, AI-native framework. Best for conversational analytics, rapid prototyping, and when flexibility is more important than consistency.

Choose based on your specific needs, budget, and use case!
