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

- 💬 **Natural Language Queries**: Ask questions about your data in plain English
- 💡 **Query Suggestions**: Get AI-recommended analysis queries based on your data characteristics
- 🤖 **LLM-Powered Analysis**: Leverages large language models for intelligent data analysis
- 📊 **Data Profiling**: Compute deterministic table and field statistics without an LLM call
- 🧩 **Modular Architecture**: Clean separation of concerns with data, analysis, and visualization modules
- 🌐 **Dual Environment**: Runs in both Node.js (DuckDB engine) and browsers (interpreter engine)

## 📖 Quick Start

### SDK

- Install `AVA` by npm

```bash
npm install @antv/ava

pnpm install @antv/ava

yarn add @antv/ava
```

- Then run the code below

**Node.js** (full feature set with DuckDB engine):

```typescript
import { AVA } from '@antv/ava';

// Initialize with LLM config
const ava = new AVA({
  llm: {
    model: 'ling-1t',
    apiKey: 'YOUR_API_KEY',
    baseURL: 'LLM_BASE_URL',
  },
  // engine: { type: 'duckdb' } is the default; no need to specify
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
// result.data → bounded analysis result (truncatedBy identifies the limiting option)
// result.sql  → the DuckDB SQL executed for the analysis

// Analyze large results safely: cap the returned rows
const rows = await ava.analysis('List companies ordered by revenue', {
  maxRows: 200,
  maxResultBytes: 1024 * 1024,
});
console.log(rows.data, rows.truncated);

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

**Browser** (interpreter engine, inline data only):

```typescript
import { AVA } from '@antv/ava/browser';

const ava = new AVA({
  llm: {
    model: 'ling-1t',
    apiKey: 'YOUR_API_KEY',
    baseURL: 'LLM_BASE_URL',
  },
  engine: { type: 'interpreter' },
});

// Browser supports inline data sources only
await ava.load({ type: 'json', options: { data: [{ city: '杭州', gdp: 18753 }] } });
await ava.load({ type: 'csv', options: { csv: 'city,gdp\n杭州,18753\n上海,43214' } });
await ava.load({ type: 'text', options: { text: '杭州 100，上海 200' } });

const result = await ava.analysis('What is the total GDP?');
const viz = await ava.visualize(result);

ava.dispose();
```

### CLI

Install the CLI:

```bash
npm install -g @antv/ava
```

Configure an OpenAI-compatible model service:

```bash
export OPENAI_API_KEY=YOUR_API_KEY
export OPENAI_MODEL=YOUR_MODEL
export OPENAI_BASE_URL=https://your-provider.example.com/v1
```

Run one analysis:

```bash
ava analyze data/companies.csv "What is the average revenue by region?"
```

### Agent Skill

Install the AVA skill in your agent workspace:

```bash
npx skills add antvis/AVA --skill ava
```

Follow the [setup guide](skills/ava/references/setup.md), then ask the agent:

> Analyze `sales.csv`, summarize sales by region, and create a chart.

## 📘 Documentation

### SDK

Create an AVA instance:

- `new AVA(config)`: initialize runtime and LLM configuration.
  - `llm`: required model config, e.g. `{ model, apiKey, baseURL }`
  - `engine?`: engine selection and options — `{ type: 'duckdb', memoryLimit?, threads?, maxTempDirectorySize?, queryTimeoutMs? }` (default), `{ type: 'interpreter' }`, or `{ type: 'supabase' }`

Core APIs in AVA:

- `load(config)`: load any data source — `{ type, options }`. Returns the dataset `Schema` (`{ tables: TableSchema[] }`; a source may expose multiple tables, e.g. a MySQL database, each registered as its own view).
  - inline types: `csv` (`{ csv }`, raw CSV content string), `json` (`{ data }`), `text` (`{ text }`)
  - file types (`{ path, headers? }`, a local path or http(s) URL such as OSS signed links): `csv-file`, `json-file`, `parquet`, `excel` (one view per sheet)
  - database types: `mysql` (`{ host, port?, database, user?, password?, ssh? }`), `postgresql` (`{ host, port?, database, user?, password?, schema?, ssh? }`) — all tables are auto-discovered and exposed
  - SQLite: `sqlite` (`{ path }`, local file) — all tables are exposed read-only, with native SQLite column types, nullability, primary keys, ordinary/unique indexes, and foreign keys in the schema. Generated columns are queryable. Defaults, CHECK constraints, triggers, and partial/expression indexes are not represented. Uses the [official SQLite extension](https://duckdb.org/docs/current/core_extensions/sqlite), installed on first use.
- `profile(options?)`: compute statistics for the loaded dataset without calling the LLM.
- `profile(options?)`: explicitly compute and retain statistics for model context without calling the LLM.
- `suggest(count?)`: generate recommended analysis questions.
- `analysis(query, config?)`: run data analysis using various strategies.
- `visualize(analysisResult)`: generate chart output from analysis result, returns `{ chartType, syntax, html } | null` (`null` when no visualization intent or no usable data).
- `dispose()`: release engine resources (DuckDB instance, temp files).

#### `profile(options?)`

`load()` only loads and returns the structural `Schema`; it does not compute a profile. Call `await ava.profile(options)` explicitly to compute, return, and retain statistics. The profile preserves the schema and adds `generatedAt`, table-level `metrics`, and a `logicalType` plus `metrics` for each field.

`analysis()` (direct and loop) and `suggest()` receive `context: { schema, profile }`: they use `stringifyProfile(profile)` when a profile is available, otherwise `stringifySchema(schema)`. Neither computes statistics implicitly. Reloading or disposing clears the stored profile; call `profile()` again to refresh statistics after external data changes.

The default metrics are `row_count`, `null_count`, `distinct_count`, `top_values`, `min`, `max`, and `mean`. Passing `metrics` replaces the defaults; an empty list returns structure without scanning data. Engines without profiling support can still analyze and suggest using schema, but explicit `profile()` calls report that profiling is unsupported.

```typescript
await ava.profile({ metrics: ['row_count', 'min', 'max', 'mean'] });
const suggestions = await ava.suggest();
```

| Metric | Applies to |
| --- | --- |
| `row_count` | Tables |
| `null_count`, `duplicate_count` | All fields |
| `distinct_count` | Numeric, string, boolean, and date fields |
| `top_values` | String and boolean fields |
| `min`, `max` | Numeric and date fields |
| `min_length`, `max_length` | String fields |
| `mean`, `sum`, `stddev`, `median` | Numeric fields |

`top_values` accepts `limit` (default `3`) and `maxDistinctRatio` (default `0.5`). It is omitted when the field's non-null distinct count is greater than the configured share of all rows.

#### `analysis(query, config?)`

Input:

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `query` | `string` | — | Natural-language analysis question. |
| `config.strategy?` | `{ type: 'direct'; maxRetries?: number } \| { type: 'loop'; maxSteps?: number } \| { type: 'subset' }` | `{ type: 'direct' }` | Analysis strategy; direct `maxRetries` defaults to 2 correction retries after execution errors (0 disables retries); loop `maxSteps` defaults to 12; subset selects question-relevant profile statistics while preserving the complete schema. |
| `config.includeSummary?` | `boolean` | `true` | Whether to include the natural-language summary in the output. |
| `config.maxRows?` | `number` | `200` | Maximum returned rows; capped at 10,000. |
| `config.maxResultBytes?` | `number` | `1 MiB` | Maximum serialized UTF-8 result size; individual fields over 1 MiB are rejected. |

Output:

| Field | Type | Description |
| --- | --- | --- |
| `query` | `string` | Original question. |
| `text` | `string` | Natural-language summary; empty when `includeSummary` is false. |
| `markdown?` | `string` | Markdown content. |
| `data` | `Record<string, unknown>[]` | Result rows. |
| `schema` | `QueryColumn[]` | Result columns. |
| `truncated?` | `true` | Whether the result was truncated. |
| `truncatedBy?` | `'maxRows' \| 'maxResultBytes'` | Limit that truncated the result. |
| `rowCount?` | `number` | Total rows, when known. |
| `sql?` | `string` | Executed SQL, when available. |

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

### CLI

Use the CLI to run one analysis without writing code:

```bash
ava analyze <source> <question> [options]
```

| Parameter | Required | Description |
| --- | --- | --- |
| `<source>` | Yes | Local path or HTTP(S) URL to the data source |
| `<question>` | Yes | Natural-language analysis question |
| `-t, --type <type>` | No | Source type when it cannot be inferred: `csv-file`, `json-file`, `parquet`, `excel`, or `sqlite` (`.sqlite`, `.sqlite3`, `.db`) |
| `-c, --chart` | No | Generate a chart |
| `-o, --output <path>` | With `--chart` | Write the chart to a new HTML file |

Examples:

```bash
ava analyze data/companies.csv "What is the average revenue by region?"
ava analyze data/companies.csv "Show revenue by region" --chart --output revenue.html
```

## 🏗️ Architecture

AVA uses a modular pipeline architecture with a pluggable engine registry. Data is loaded from multiple sources via `load`, then analyzed by the selected engine, summarized using LLM into natural language responses, and optionally visualized with chart recommendations.

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
│                 │   • Local/remote file (csv-file/json-file/parquet/excel) [Node.js]
│                 │   • Database (mysql/postgresql) [Node.js]
└─────────────────┘
    ↓
┌──────────────────┐
│ Metadata Extract │ → Type inference and structural schema
└──────────────────┘
    ↓
┌─────────────────────────────────┐
│  Engine Registry                │
│  ├─ DuckDB Engine (Node.js)     │ → SQL via in-memory DuckDB
│  ├─ Interpreter Engine (Browser)│ → JavaScript sandbox execution
│  └─ Supabase Engine (Node.js)   │ → Remote SQL via Supabase API
└─────────────────────────────────┘
    ↓
┌──────────────────┐
│ Analysis Module  │ → Generate & Execute Query
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

### Engine Registry

Engines are registered by the entry point, so the core `AVA` class never imports any engine implementation directly. This keeps Node-only engines (DuckDB, Supabase) out of browser bundles.

- **Node.js** (`@antv/ava`): registers `duckdb`, `supabase`, and `interpreter` engines
- **Browser** (`@antv/ava/browser`): registers only the `interpreter` engine

## 🌐 Environment Support

### Node.js

Full feature set backed by an in-memory DuckDB instance (LLM generates SQL):

- Inline data (csv/json/text), local/remote files (csv-file/json-file/parquet/excel), and databases (mysql/postgresql) via `load`
- File system access for CSV loading, plus remote files such as OSS signed URLs
- Data is never materialized into JS memory for file sources — DuckDB reads them directly
- Database sources ATTACH through DuckDB's mysql/postgres extensions; every table is auto-discovered and exposed to the LLM (with optional SSH tunneling)
- Supabase engine for remote SQL execution via Supabase Management API

### Browser

Lightweight interpreter engine for client-side analytics:

- Inline data sources only: `csv`, `json`, `text`
- JavaScript sandbox execution with `stat` helper functions
- No file system or database access
- Import from `@antv/ava/browser` to avoid bundling Node.js dependencies

## 🤝 Developer Contributions

This is an experimental branch. Contributions are welcome! Please ensure:

- Code is clean and well-documented
- TypeScript types are properly defined
- New features include examples, and tests
- READMEs are updated as needed

### Running tests with an LLM

Copy `.env.example` to `.env` and fill in `OPENAI_API_KEY` (optionally `OPENAI_MODEL` / `OPENAI_BASE_URL`). Vitest loads `.env` through `vitest.setup.ts`, so `npm test` picks it up with no extra flags. Without a key the LLM-dependent suites are reported as **skipped**, and the rest of the suite still runs offline.

## 🔗 Related Projects

- [GPT-Vis](https://github.com/antvis/GPT-Vis) - Visualization components
- [Chart Visualization Skills](https://github.com/antvis/chart-visualization-skills) - LLM skills for charts
- [Vercel AI SDK](https://sdk.vercel.ai/) - LLM integration

## 📚 Papers

[VizLinter](https://vegalite-linter.idvxlab.com/) - Chen, Q., Sun, F., Xu, X., Chen, Z., Wang, J. and Cao, N., 2021. VizLinter: A Linter and Fixer Framework for Data Visualization. *IEEE transactions on visualization and computer graphics*, 28(1), pp.206-216.

[《数据可视化设计的类型学实践》（Exploring the Typology of Visualization Design）](https://oversea.cnki.net/KCMS/detail/detail.aspx?dbcode=CJFD&dbname=CJFDAUTO&filename=MSDG202203021&uniplatform=OVERSEAS_EN&v=HcZsiecIxauSoKEB1s92_BImgnrMiazYsfZUpb-gcl0zXYx_MEwv5alz1UgtPjz1) - 蓝星宇, 王嘉喆. 数据可视化设计的类型学实践, 《美术大观》, 2022(3), 149-152.

## 📄 License

MIT
