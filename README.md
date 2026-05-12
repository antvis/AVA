<div align="center">
  <h1>AVA, AI-native Visual Analytics</h1>
  <img width="200" height="120" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original" alt="AVA logo">
</div>

[AVA](https://github.com/antvis/AVA) (<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*QzIsSrfsCW0AAAAAAAAAAAAADmJ7AQ/original" width="16" alt="AVA examples"> Visual Analytics) is a technology framework designed for more convenient visual analytics. The first **A** has multiple meanings: AI native, Automated, Augmented, and **VA** stands for Visual Analytics. It can assist users in unstructured data loading, data processing and analysis, as well as visualization code generation.

<p align="center">
  <a href="https://github.com/antvis/ava">
    <img src="https://img.shields.io/badge/GitHub-000000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  <a href="https://ava.antv.vision">
    <img src="https://img.shields.io/badge/Website-2F54EB?style=for-the-badge" alt="Website" />
  </a>
  <a href="https://ava.antv.vision/documentation">
    <img src="https://img.shields.io/badge/Docs-722ED1?style=for-the-badge" alt="Documentation" />
  </a>
  <a href="https://ava.antv.vision/">
    <img src="https://img.shields.io/badge/AI%20Agent-EB2F96?style=for-the-badge" alt="AI Agent" />
  </a>
  <a href="https://github.com/antvis/AVA/blob/ai/llms.txt">
    <img src="https://img.shields.io/badge/LLMS-FA8C16?style=for-the-badge" alt="llms" />
  </a>
</p>

## 🚀 Features

AVA is a fundamental shift from rule-based analytics to AI-native capabilities:

- **Natural Language Queries**: Ask questions about your data in plain English
- **Query Suggestions**: Get AI-recommended analysis queries based on your data characteristics
- **LLM-Powered Analysis**: Leverages large language models for intelligent data analysis
- **Smart Data Handling**: Automatically chooses between in-memory processing and SQLite based on data size
- **Modular Architecture**: Clean separation of concerns with data, analysis, and visualization modules
- **Browser & Node.js Compatible**: Runs seamlessly in both browser and server environments

## 📖 Quick Start

- Install `AVA` by npm

```bash
npm install @antv/ava

pnpm install @antv/ava

yarn add @antv/ava
```

- Then run  the code below

```typescript
import { AVA } from '@antv/ava';

// Initialize with LLM config
const ava = new AVA({
  llm: {
    model: 'ling-1t',
    apiKey: 'YOUR_API_KEY',
    baseURL: 'LLM_BASE_URL',
  },
  sqlThreshold: 1024 * 1024 * 2, // Threshold for switching to SQLite
});

// Load data from various sources in Node.js
await ava.loadCSV('data/companies.csv');

// Load CSV from file input in browser
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const csvContent = await file.text();
await ava.loadCSV(csvContent);

// or load from JSON object
await ava.loadObject([{ city: '杭州', gdp: 18753 }, { city: '上海', gdp: 43214 }]);

// or load from URL
await ava.loadURL('https://api.example.com/data', (response) => response.data);

// or extract from text
await ava.loadText('杭州 100，上海 200，北京 300');

// Get suggested analysis queries
const queries = await ava.suggest(5); // Get top 5 suggested queries (default: 3)
console.log(queries);
// [
//   {
//     query: 'What is the average revenue by region?',
//     score: 0.95,
//     reason: 'Understanding revenue distribution across regions helps identify high-performing areas'
//   },
//   ...
// ]

// Ask questions in natural language
const result = await ava.analysis('What is the average revenue by region?');
console.log(result);

// Or use a suggested query
const suggestedResult = await ava.analysis(queries[0].query);
console.log(suggestedResult);

// Clean up
ava.dispose();
```

## 🏗️ Architecture

AVA uses a modular pipeline architecture that processes user queries through distinct stages. Data is loaded from multiple sources (CSV, JSON, URL, or text), analyzed intelligently based on size (JavaScript for small datasets, SQLite for large ones), results are summarized using LLM into natural language responses, and optionally visualized with chart recommendations.

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
┌─────────────────────┐
│ Visualization       │ → Optional chart generation:
│ Module (Optional)   │   • Detect visualization intent
│                     │   • Recommend chart type
│                     │   • Generate chart syntax & HTML
└─────────────────────┘
    ↓
User Response
(Text + Data + Chart)
```

## 🌐 Browser & Server Compatibility

AVA v4 is designed to run seamlessly in both browser and Node.js environments:

### ✅ Browser Support
- All core features work in modern browsers (Chrome, Firefox, Safari, Edge)
- CSV loading via File API or direct content strings
- JSON object and URL loading fully supported
- In-memory data processing for datasets under 10KB
- Note: Uses IndexedDB for persistent storage of large datasets (default >10KB) in browsers; for extremely large datasets, use the server-side version to avoid memory pressure

### ✅ Node.js Support
- Full feature set including large dataset handling with SQLite
- File system access for CSV loading
- Automatic switching between in-memory and SQLite based on data size (10KB threshold)

### Environment Detection
AVA automatically detects the runtime environment and adapts:
- **Browser**: Uses in-memory processing, accepts CSV content strings
- **Node.js**: Supports file paths for CSV, uses SQLite for large datasets (>10KB)

## 🤝 Developer Contributions

This is an experimental branch. Contributions are welcome! Please ensure:

- Code is clean and well-documented
- TypeScript types are properly defined
- New features include examples, and tests
- READMEs are updated as needed

## 🔗 Related Projects

- [GPT-Vis](https://github.com/antvis/GPT-Vis) - Visualization components
- [Chart Visualization Skills](https://github.com/antvis/chart-visualization-skills) - LLM skills for charts
- [Vercel AI SDK](https://sdk.vercel.ai/) - LLM integration

## 📚 Papers

[VizLinter](https://vegalite-linter.idvxlab.com/) - Chen, Q., Sun, F., Xu, X., Chen, Z., Wang, J. and Cao, N., 2021. VizLinter: A Linter and Fixer Framework for Data Visualization. *IEEE transactions on visualization and computer graphics*, 28(1), pp.206-216.

[《数据可视化设计的类型学实践》（Exploring the Typology of Visualization Design）](https://oversea.cnki.net/KCMS/detail/detail.aspx?dbcode=CJFD&dbname=CJFDAUTO&filename=MSDG202203021&uniplatform=OVERSEAS_EN&v=HcZsiecIxauSoKEB1s92_BImgnrMiazYsfZUpb-gcl0zXYx_MEwv5alz1UgtPjz1) - 蓝星宇, 王嘉喆. 数据可视化设计的类型学实践, 《美术大观》, 2022(3), 149-152.

## 📄 License

MIT
