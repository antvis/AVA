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
- **Smart Data Handling**: Automatically chooses between in-memory processing and DuckDB based on data size
- **Modular Architecture**: Clean separation of concerns with data, analysis, and visualization modules
- **Node.js**: Runs in Node.js, backed by an in-memory DuckDB instance

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
});

// Load data from various sources — all through ava.load({ type, options })

// CSV file in Node.js (local path or http(s) URL)
await ava.load({ type: 'csv-file', options: { path: 'data/companies.csv' } });

// or load a local/remote file directly into DuckDB (csv-file/json-file/parquet/excel, e.g. OSS signed URL)
await ava.load({ type: 'parquet', options: { path: 'https://example.com/data.parquet' } });
await ava.load({ type: 'csv-file', options: { path: 'data/companies.csv' } });
// an Excel workbook registers one view per sheet
await ava.load({ type: 'excel', options: { path: 'data/report.xlsx' } });

// or load inline CSV content
await ava.load({ type: 'csv', options: { csv: 'city,gdp\n杭州,18753\n上海,43214' } });

// or load from a JSON object array
await ava.load({ type: 'json', options: { data: [{ city: '杭州', gdp: 18753 }, { city: '上海', gdp: 43214 }] } });

// or extract from text
await ava.load({ type: 'text', options: { text: '杭州 100，上海 200，北京 300' } });

// or attach a database (every table is exposed to the LLM)
await ava.load({ type: 'mysql', options: { host: 'localhost', database: 'mydb', user: 'root', password: 'secret' } });

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
console.log(result.text);  // Natural language summary
// result.data → structured analysis result
// result.sql  → the DuckDB SQL executed for the analysis

// Generate chart visualization from analysis result
const viz = await ava.visualize(result);
console.log(viz.chartType); // e.g. 'column'
console.log(viz.syntax);   // GPT-Vis chart syntax
// viz.html → standalone HTML that renders the chart


// Or use a suggested query
const suggestedResult = await ava.analysis(queries[0].query);
console.log(suggestedResult);

// Clean up
ava.dispose();
```

## 📘 Documentation

Create an AVA instance:

- `new AVA(config)`: initialize runtime and LLM configuration.
  - `llm`: required model config, e.g. `{ model, apiKey, baseURL }`
  - `engine?`: optional DuckDB resource limits — `{ memoryLimit?, threads?, maxTempDirectorySize?, queryTimeoutMs? }` (defaults: `512MB`, `1` thread, `30s` query timeout)

Core APIs in AVA:

- `load(config)`: load any data source — `{ type, options }`. Returns the dataset `Schema` (`{ tables: TableSchema[] }`; a source may expose multiple tables, e.g. a MySQL database, each registered as its own view).
  - inline types: `csv` (`{ csv }`, raw CSV content string), `json` (`{ data }`), `text` (`{ text }`)
  - file types (`{ path, headers? }`, a local path or http(s) URL such as OSS signed links): `csv-file`, `json-file`, `parquet`, `excel` (one view per sheet)
  - database types: `mysql` (`{ host, port?, database, user?, password?, ssh? }`), `postgresql` (`{ host, port?, database, user?, password?, schema?, ssh? }`) — all tables are auto-discovered and exposed
- `suggest(count?)`: generate recommended analysis questions.
- `analysis(query)`: run data analysis and return `{ query, text, data, sql? }` — `sql` is the DuckDB SQL executed for the analysis.
- `visualize(analysisResult)`: generate chart output from analysis result, returns `{ chartType, syntax, html } | null` (`null` when no visualization intent or no usable data).
- `dispose()`: release engine resources (DuckDB instance, temp files).

Minimal usage:

```typescript
const ava = new AVA({ llm: { model, apiKey, baseURL } });

await ava.load({ type: 'json', options: { data: [{ city: 'Hangzhou', gdp: 18753 }] } });

const analysis = await ava.analysis('Show GDP by city');
console.log(analysis.text);

const viz = await ava.visualize(analysis);
if (viz) {
  console.log(viz.chartType);
  console.log(viz.html);
}

ava.dispose();
```

## 🏗️ Architecture

AVA uses a modular pipeline architecture that processes user queries through distinct stages. Data is loaded from multiple sources (inline CSV/JSON/text, local/remote files, or databases) via `load`, then analyzed by the DuckDB engine (natural-language queries are turned into SQL via LLM and executed against an in-memory DuckDB instance), summarized using LLM into natural language responses, and optionally visualized with chart recommendations.

```
User Query
    ↓
AVA Instance
    ↓
┌─────────────────┐
│  Data Module    │ → Load from multiple sources (load):
│                 │   • Inline CSV (csv)
│                 │   • JSON object array (json)
│                 │   • Text (text + LLM)
│                 │   • Local/remote file (csv-file/json-file/parquet/excel)
│                 │   • Database (mysql/postgresql)
└─────────────────┘
    ↓
┌──────────────────┐
│ Metadata Extract │ → Type inference, statistics (via DuckDB)
└──────────────────┘
    ↓
┌──────────────────┐
│  DuckDB Engine   │ → SQL via DuckDB, Node.js only
└──────────────────┘
    ↓
┌──────────────────┐
│ Analysis Module  │ → Generate & Execute SQL
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

## 🌐 Node.js Support

AVA v4 runs in Node.js, backed by an in-memory DuckDB instance (LLM generates SQL):

- Full feature set: inline data (csv/json/text), local/remote files (csv-file/json-file/parquet/excel), and databases (mysql/postgresql) via `load`
- File system access for CSV loading, plus remote files such as OSS signed URLs
- Data is never materialized into JS memory for file sources — DuckDB reads them directly
- Database sources ATTACH through DuckDB's mysql/postgres extensions; every table is auto-discovered and exposed to the LLM (with optional SSH tunneling)

## 🤝 Developer Contributions

This is an experimental branch. Contributions are welcome! Please ensure:

- Code is clean and well-documented
- TypeScript types are properly defined
- New features include examples, and tests
- READMEs are updated as needed

### Running tests with an LLM

Copy `.env.example` to `.env` and fill in `OPENAI_LLM_API_KEY` (optionally `OPENAI_LLM_MODEL` / `OPENAI_LLM_BASE_URL`). Vitest loads `.env` through `vitest.setup.ts`, so `npm test` picks it up with no extra flags. Without a key the LLM-dependent suites are reported as **skipped**, and the rest of the suite still runs offline.

## 🔗 Related Projects

- [GPT-Vis](https://github.com/antvis/GPT-Vis) - Visualization components
- [Chart Visualization Skills](https://github.com/antvis/chart-visualization-skills) - LLM skills for charts
- [Vercel AI SDK](https://sdk.vercel.ai/) - LLM integration

## 📚 Papers

[VizLinter](https://vegalite-linter.idvxlab.com/) - Chen, Q., Sun, F., Xu, X., Chen, Z., Wang, J. and Cao, N., 2021. VizLinter: A Linter and Fixer Framework for Data Visualization. *IEEE transactions on visualization and computer graphics*, 28(1), pp.206-216.

[《数据可视化设计的类型学实践》（Exploring the Typology of Visualization Design）](https://oversea.cnki.net/KCMS/detail/detail.aspx?dbcode=CJFD&dbname=CJFDAUTO&filename=MSDG202203021&uniplatform=OVERSEAS_EN&v=HcZsiecIxauSoKEB1s92_BImgnrMiazYsfZUpb-gcl0zXYx_MEwv5alz1UgtPjz1) - 蓝星宇, 王嘉喆. 数据可视化设计的类型学实践, 《美术大观》, 2022(3), 149-152.

## 📄 License

MIT
