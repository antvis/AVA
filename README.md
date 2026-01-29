# AVA v4 - AI Branch

This is the development branch for AVA v4, a complete rewrite focused on **AI-native Visual Analytics**.

## 🚀 What's New in v4

AVA v4 is a fundamental shift from rule-based analytics to AI-native capabilities:

- **Natural Language Queries**: Ask questions about your data in plain English
- **LLM-Powered Analysis**: Leverages large language models for intelligent data analysis
- **Smart Data Handling**: Automatically chooses between in-memory processing and SQLite based on data size
- **Modular Architecture**: Clean separation of concerns with data, analysis, and visualization modules

## 📦 Project Structure

```
AVA/
├── src/                   # Source code
│   ├── data/             # Data loading and processing
│   ├── analysis/         # Query generation and execution
│   ├── visualize/        # Chart recommendation (coming soon)
│   ├── ava.ts            # Main AVA class
│   └── types.ts          # TypeScript definitions
├── packages/ava/         # Main AVA v4 package
│   └── README.md
├── examples/             # Usage examples
│   ├── basic-usage.ts
│   └── README.md
└── data/                 # Sample datasets
    └── companies.csv
```

## 🛠️ Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- OpenAI API key (or compatible LLM provider)

### Installation

```bash
# Install dependencies
cd packages/ava
npm install --ignore-scripts

# Build the package
npm run build
```

### Running Examples

```bash
# Set your API key
export OPENAI_API_KEY='your-api-key-here'

# Run example (requires ts-node)
npm install -g ts-node
ts-node examples/basic-usage.ts
```

## 📖 Quick Start

```typescript
import { AVA } from '@antv/ava';

// Initialize with LLM config
const ava = new AVA({
  llm: {
    model: 'gpt-4',
    apiKey: 'YOUR_API_KEY',
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

## 🎯 Design Principles

1. **AI-Native**: LLMs at the core, not an add-on
2. **Simple & Clean**: Minimal dependencies, clean code
3. **Smart Defaults**: Automatic optimization based on data size
4. **Developer-Friendly**: Clear APIs, comprehensive documentation
5. **Extensible**: Modular design for easy customization

## 🔧 Configuration

### LLM Configuration

```typescript
const ava = new AVA({
  llm: {
    model: 'gpt-4',              // Model name
    apiKey: 'your-key',          // API key
    baseURL: 'https://...',      // Optional: custom endpoint
  },
  sqliteThreshold: 10 * 1024,    // Optional: SQLite threshold in bytes
});
```

### Supported Models

- OpenAI: `gpt-4`, `gpt-3.5-turbo`, `gpt-4-turbo`
- Any OpenAI-compatible API endpoint

## 📚 Documentation

- [Package README](./packages/ava/README.md) - Main package documentation
- [Data Module](./src/data/README.md) - Data loading and processing
- [Analysis Module](./src/analysis/README.md) - Query generation and execution
- [Examples](./examples/README.md) - Usage examples and tutorials

## 🚧 Roadmap

- [x] Core data loading (CSV)
- [x] Natural language to code/SQL
- [x] Smart data handling (JavaScript/SQLite)
- [x] Basic analysis capabilities
- [ ] Visualize module with chart recommendations
- [ ] Additional data sources (JSON, Excel, APIs)
- [ ] Streaming responses
- [ ] Chart rendering integration
- [ ] Advanced aggregation operations
- [ ] Multi-table queries

## 🤝 Contributing

This is an experimental branch. Contributions are welcome! Please ensure:

- Code is clean and well-documented
- TypeScript types are properly defined
- New features include examples
- READMEs are updated as needed

## 📝 Notes

- This branch (`ai`) contains a complete rewrite and is not backward compatible with AVA v3
- The focus is on AI-native capabilities using LLMs
- Dependencies are minimal to keep the package lightweight
- Uses Vercel AI SDK for LLM integration
- SQLite (via better-sqlite3) for large dataset handling

## 🔗 Related Projects

- [GPT-Vis](https://github.com/antvis/GPT-Vis) - Visualization components
- [Chart Visualization Skills](https://github.com/antvis/chart-visualization-skills) - LLM skills for charts
- [Vercel AI SDK](https://sdk.vercel.ai/) - LLM integration

## 📄 License

MIT
