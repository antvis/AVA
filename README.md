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

// Load data
await ava.loadCSV('data/companies.csv');

// Ask questions in natural language
const result = await ava.analysis('What is the average revenue by region?');
console.log(result);

// Clean up
ava.dispose();
```

## 🏗️ Architecture

### Core Modules

#### 1. Data Module
- CSV file loading with automatic parsing
- Type inference (number, string, date, boolean)
- Metadata extraction (unique counts, null counts, samples)
- Smart data size detection

#### 2. Analysis Module
- **Small datasets (<10KB)**: JavaScript helper functions for in-memory analysis
- **Large datasets (≥10KB)**: Automatic SQLite storage for efficient querying
- Natural language to code/SQL generation using LLM
- Safe code execution environment

#### 3. Visualize Module (Coming Soon)
- AI-powered chart recommendations
- Automatic spec generation
- Integration with visualization libraries

### Data Flow

```
User Query
    ↓
AVA Instance
    ↓
┌─────────────┐
│ Data Module │ → Load & Parse CSV
└─────────────┘
    ↓
┌──────────────┐
│Size Check    │
└──────────────┘
    ↓         ↓
 <10KB      ≥10KB
    ↓         ↓
JavaScript  SQLite
 Helpers     Query
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
- [x] Natural language to code/SQL
- [x] Smart data handling (JavaScript/SQLite)
- [x] Basic analysis capabilities
- [x] Comprehensive unit tests with vitest
- [ ] Visualize module with chart recommendations
- [ ] Additional data sources (JSON, Excel, APIs)
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
