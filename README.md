# AVA

AVA, a complete rewrite focused on **AI-native Visual Analytics**.

[AVA](https://github.com/antvis/AVA) (<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*QzIsSrfsCW0AAAAAAAAAAAAADmJ7AQ/original" width="16" alt="AVA examples"> Visual Analytics) is a technology framework designed for more convenient visual analytics. The first **A** has multiple meanings: AI native, Automated, Augmented, and **VA** stands for Visual Analytics. It can assist users in unstructured data loading, data processing and analysis, as well as visualization code generation.

<br />

<div align="center">
  <img width="200" height="120" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original" alt="AVA logo">
</div>

## 🚀 Features

AVA is a fundamental shift from rule-based analytics to AI-native capabilities:

- **Natural Language Queries**: Ask questions about your data in plain English
- **LLM-Powered Analysis**: Leverages large language models for intelligent data analysis
- **Smart Data Handling**: Automatically chooses between in-memory processing and SQLite based on data size
- **Modular Architecture**: Clean separation of concerns with data, analysis, and visualization modules

## 📖 Quick Start

```typescript
import { AVA } from '@antv/ava';

// Initialize with LLM config
const ava = new AVA({
  llm: {
    model: 'ling-1t',
    apiKey: 'YOUR_API_KEY',
    baseURL: 'LLM_BASE_URL',
  },
});

// Load data from various sources
await ava.loadCSV('data/companies.csv');
// or load from JSON object
await ava.loadObject([{ city: '杭州', gdp: 18753 }, { city: '上海', gdp: 43214 }]);
// or load from URL
await ava.loadURL('https://api.example.com/data', (response) => response.data);
// or extract from text
await ava.loadText('杭州 100，上海 200，北京 300');

// Ask questions in natural language
const result = await ava.analysis('What is the average revenue by region?');
console.log(result);

// Clean up
ava.dispose();
```

## 🏗️ Architecture

### Data Flow

```
User Query
    ↓
AVA Instance
    ↓
┌─────────────────┐
│  Data Module    │ → Load from multiple sources:
│                 │   • CSV File (loadCSV)
│                 │   • JSON Object (loadObject)
│                 │   • URL (loadURL)
│                 │   • Text (loadText + LLM)
└─────────────────┘
    ↓
┌──────────────────┐
│ Metadata Extract │ → Type inference, statistics
└──────────────────┘
    ↓
┌──────────────┐
│  Size Check  │
└──────────────┘
    ↓         ↓
 <10KB      ≥10KB
    ↓         ↓
JavaScript  SQLite
 Helpers    Storage
    ↓         ↓
┌──────────────────┐
│ Analysis Module  │ → Generate & Execute Code/SQL
└──────────────────┘
    ↓
┌──────────────┐
│ LLM Summary  │ → Natural Language Response
└──────────────┘
    ↓
User Response
```

## 🚧 Roadmap

- [x] Core data loading (CSV)
- [x] Multiple data sources (JSON Object, URL, Text)
- [x] Natural language to code/SQL
- [x] Smart data handling (JavaScript/SQLite)
- [x] Basic analysis capabilities
- [x] Comprehensive unit tests with vitest
- [ ] Visualize module with chart recommendations
- [ ] Additional data sources (Excel, Database connections)
- [ ] Streaming responses
- [ ] Chart rendering integration
- [ ] Advanced aggregation operations
- [ ] Multi-table queries

## 🤝 Developer Contributions

This is an experimental branch. Contributions are welcome! Please ensure:

- Code is clean and well-documented
- TypeScript types are properly defined
- New features include examples
- READMEs are updated as needed

## 🔗 Related Projects

- [GPT-Vis](https://github.com/antvis/GPT-Vis) - Visualization components
- [Chart Visualization Skills](https://github.com/antvis/chart-visualization-skills) - LLM skills for charts
- [Vercel AI SDK](https://sdk.vercel.ai/) - LLM integration

## 📄 License

MIT
