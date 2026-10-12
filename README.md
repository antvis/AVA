<div align="center">
  <h1>AVA, AI-native Visual Analytics</h1>
  <img width="200" height="120" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original" alt="AVA logo">
</div>

AVA is a framework for AI-native visual analytics. It connects data loading, computation, natural-language analysis, and visualization so an AI agent can answer questions with results grounded in data.

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
  <a href="https://github.com/antvis/AVA/blob/ai/skills/ava/SKILL.md">
    <img src="https://img.shields.io/badge/AI%20Skill-EB2F96?style=for-the-badge" alt="AVA Skill" />
  </a>
  <a href="https://github.com/antvis/AVA/blob/ai/llms.txt">
    <img src="https://img.shields.io/badge/LLMS-FA8C16?style=for-the-badge" alt="llms.txt" />
  </a>
</p>

## Start here

Choose the way you want to use AVA:

| If you want to... | Start with |
| --- | --- |
| Add data analysis to a Node.js application | [SDK quick start](#1-run-your-first-analysis-with-the-sdk) |
| Analyze a file from your terminal | [CLI quick start](#2-analyze-a-file-with-the-cli) |
| Let an AI coding agent analyze data | [AVA Skill and framework prompt](#3-use-an-ai-agent) |
| Find every option and supported source | [API and runtime overview](#choose-your-data-source-and-runtime) |

AVA is designed to make analysis verifiable: the model can help form a question and explain results, while an execution engine performs the data computations.

## 1. Run your first analysis with the SDK

Requires Node.js 22.13 or later. Install AVA:

```bash
npm install @antv/ava
```

Load data, inspect its structure, ask a question, and optionally create a chart:

```typescript
import { AVA } from '@antv/ava';

const ava = new AVA({
  llm: {
    model: 'YOUR_MODEL',
    apiKey: 'YOUR_API_KEY',
    baseURL: 'YOUR_OPENAI_COMPATIBLE_ENDPOINT',
  },
});

try {
  // 1. Start with data you already have.
  const schema = await ava.source({
    type: 'json',
    options: { data: [{ region: 'East', sales: 120 }, { region: 'West', sales: 90 }] },
  });
  console.log(schema.tables);

  // 2. Optionally calculate deterministic statistics; this does not call the LLM.
  const profile = await ava.profile({ metrics: ['row_count', 'null_count', 'min', 'max'] });
  console.log(profile.tables[0].metrics);

  // 3. Ask a question. AVA returns the answer and the computed rows.
  const result = await ava.analyze('What are total sales by region?');
  console.log(result.text);
  console.log(result.data);

  // 4. Create a chart when it helps answer the question.
  const chart = await ava.visualize(result);
  if (chart) console.log(chart.html);
} finally {
  ava.dispose();
}
```

Keep API keys on the server; never embed them in browser code. See [data sources and runtime options](#choose-your-data-source-and-runtime) before connecting files or databases.

## 2. Analyze a file with the CLI

The CLI is useful for one-off analysis and automation. It requires Node.js 22.13 or later on macOS or Linux.

```bash
npm install -g @antv/ava

# Configure an OpenAI-compatible model. Replace these values for your provider.
export OPENAI_API_KEY='your-api-key'
export OPENAI_MODEL='your-model'
export OPENAI_BASE_URL='https://your-provider.example.com/v1'

ava source /absolute/path/sales.csv
```

Copy the dataset ID returned by `source`, then use it for each step:

```bash
DATASET_ID='ds_sales_your-id-here'

# Learn the real table and column names before asking a question.
ava schema "$DATASET_ID"

# Optional: inspect deterministic statistics without an LLM call.
ava profile "$DATASET_ID"

# Analyze, then release the session when finished.
ava analyze "$DATASET_ID" "What is the average sales value by region?" > analysis.json
ava dispose "$DATASET_ID"
```

For a chart, pass the analysis rows to `visualize`:

```bash
node -p 'JSON.stringify(require("./analysis.json").data)' > rows.json
ava visualize --query "Compare average sales by region" --data @rows.json --output chart.html
```

Open `chart.html` in a browser. Run `ava <command> --help` for options, or see the [CLI skill references](skills/ava/SKILL.md).

## 3. Use an AI agent

Install the [AVA Skill](skills/ava/SKILL.md) so an agent can use the CLI to load data, inspect schemas, query, validate results, and render charts. The agent plans and interprets the analysis; AVA executes computations. This workflow uses the agent's own reasoning and does not require a separate model API key for AVA.

Add the marketplace in Claude Code:

```text
/plugin marketplace add antvis/AVA
```

Or install the skill for supported agents:

```bash
npx skills add antvis/AVA
```

### Reusable analysis prompt

Copy this prompt into an agent session and fill in the bracketed details:

```text
Use the AVA Skill to analyze [data source] and answer:
[question]

Work through the analysis in order:
1. Load the data with AVA and inspect its schema. Use the actual table and column names; do not assume fields or relationships.
2. Clarify the population, metric definitions, filters, grouping, time range, and units. Ask me if an ambiguity could change the answer.
3. Profile or sample the data when useful, then write and execute a targeted query with AVA.
4. Validate the result scope, calculations, missing values, and completeness. Recheck important totals when practical.
5. Create a chart only if it makes the answer clearer, using the actual computed results.
6. Report the answer, method, and relevant limitations. Separate measured facts from hypotheses.

Use read-only analysis. Do not invent data, claim an unexecuted query was run, or present an unverified conclusion as fact. Dispose of sessions created for this task when finished.
```

## How an AVA analysis progresses

An analysis moves from understanding the data to answering a question; charts are optional:

1. **Load** a file, inline data, or database with `source`.
2. **Understand** the returned schema and, when helpful, compute a profile.
3. **Ask** a specific question with `analyze`, or generate candidate questions with `suggest`.
4. **Check** the executed result and its limitations before interpreting it.
5. **Visualize** useful results and deliver a concise answer with its assumptions.

Profiling computes deterministic statistics without an LLM. Analysis may use an LLM to formulate a query, then runs that query in the selected engine. AVA returns computed rows and, when available, the SQL; the model's explanation should be checked against those results.

## Choose your data source and runtime

| Data or environment | Engine | Notes |
| --- | --- | --- |
| Inline CSV, JSON, or text | DuckDB by default in Node.js | `text` extraction requires an LLM; JavaScript is also available when explicitly selected. |
| CSV, JSON, Parquet, or Excel files | DuckDB by default; Python is optional | Node.js only. Excel sheets are exposed as separate tables. |
| MySQL, PostgreSQL, SQLite, or MongoDB | DuckDB | Node.js only; source tables or collections are discovered during loading. |
| ClickHouse or Supabase | ClickHouse or Supabase engine | Node.js only; connects to the remote service. |
| Browser applications | JavaScript interpreter | Inline CSV, JSON, or text only; import from `@antv/ava/browser`. |

The default Node.js engine is DuckDB. Use Python when pandas is needed (`python3` and pandas must be available); it does not connect directly to databases. The browser entry registers only the JavaScript engine and excludes Node.js-only dependencies.

Common SDK source types:

| Source | Example options |
| --- | --- |
| Inline CSV | `{ csv: 'region,sales\\nEast,120' }` |
| JSON rows | `{ data: [{ region: 'East', sales: 120 }] }` |
| Text | `{ text: 'East sales 120' }` |
| Local or remote file | `{ path: '/data/sales.csv' }` |
| Database | Connection options specific to `mysql`, `postgresql`, `sqlite`, `mongodb`, `clickhouse`, or `supabase` |

For connection fields, file options, authentication, and engine-specific guidance, see the [data source documentation](https://ava.antv.vision/documentation) or the [AVA Skill source reference](skills/ava/references/sources.md).

## API and CLI overview

### SDK

| API | Purpose |
| --- | --- |
| `new AVA({ llm, engine? })` | Configure the model and optionally select an engine. DuckDB is the Node.js default. |
| `source({ type, options })` | Load data and return its schema. |
| `profile(options?)` | Compute and retain dataset statistics without an LLM call. |
| `suggest(count?)` | Generate recommended analysis questions. |
| `analyze(query, config?)` | Analyze a natural-language question; returns a summary and bounded result rows. |
| `visualize(analysisResult)` | Generate chart syntax and HTML when useful, or return `null`. |
| `dispose()` | Release engine resources and temporary files. |

Profiling defaults to `row_count`, `null_count`, `distinct_count`, `top_values`, `min`, `max`, and `mean`. Supplying `metrics` replaces the defaults; `metrics: []` returns structure without scanning data.

`analyze` supports `direct` (default), `loop`, and `subset` strategies. Results include `query`, `text`, `data`, and `schema`; `sql`, `truncated`, and `truncatedBy` are available when applicable. Returned rows are bounded by `maxRows` (default 200, maximum 10,000) and `maxResultBytes` (default 1 MiB).

### CLI

| Command | Purpose | Requires AI |
| --- | --- | --- |
| `source` | Load data and create a dataset session | Only for text sources |
| `schema` | Inspect tables, fields, and query language | No |
| `profile` | Compute data statistics | No |
| `query` | Execute SQL, Python, or JavaScript for the selected engine | No |
| `suggest` | Recommend analysis questions | Yes |
| `translate` | Generate a query without executing it | Yes |
| `analyze` | Analyze data with a natural-language question | Yes |
| `recommend` | Generate a chart specification | Yes |
| `visualize` | Generate a chart and HTML | Yes |
| `viz` | Render a chart specification to HTML | No |
| `dispose` | Release a dataset session | No |

CLI sessions expire after 30 minutes of inactivity or when disposed. Configure the model before loading a dataset; `.env` is not loaded automatically:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | API key for the selected provider |
| `OPENAI_MODEL` | Model name; defaults to `gpt-4o-mini` |
| `OPENAI_BASE_URL` | Optional OpenAI-compatible endpoint |

## Analysis accuracy

We evaluate AVA on [DataBench](evals/databench/README.md), a benchmark for questions involving filtering, aggregation, and sorting. Results below use **GLM 5.1** on **1,789 questions**:

| Analysis approach | Answer accuracy | Avg. time / question | Avg. tokens / question |
| --- | --- | --- | --- |
| AVA Workflow: default analysis | 84.46% | 18.44 s | 903 |
| AVA Workflow: with dataset statistics | 86.64% | 20.48 s | 2,315 |
| AVA Workflow: with question-relevant dataset statistics | **86.70%** | 25.42 s | 1,173 |
| AVA Workflow: iterative, multi-step analysis | 84.07% | 82.52 s | 5,089 |
| AVA Workflow: Python analysis with dataset statistics | 85.41% | 22.03 s | 2,002 |
| AVA Agent + AVA Skill | 84.46% | 40.93 s | 23,384 |

[AVA Workflow](evals/ava-workflow/README.md) follows a predefined process; [AVA Agent](evals/ava-agent/README.md) lets the model choose tools and steps. See the [evaluation methodology and reports](evals/ACCURACY.md) for configurations, dates, and raw results.

## Contributing

Contributions are welcome. Please keep code clean and typed, add examples and tests for new features, and update related documentation.

To run the tests that require an LLM, copy `.env.example` to `.env` and set `OPENAI_API_KEY` (optionally `OPENAI_MODEL` and `OPENAI_BASE_URL`). Without a key, those suites are skipped and the remaining tests run offline.

## Related projects

- [GPT-Vis](https://github.com/antvis/GPT-Vis) — visualization components
- [Chart Visualization Skills](https://github.com/antvis/chart-visualization-skills) — chart skills for LLMs
- [Vercel AI SDK](https://sdk.vercel.ai/) — LLM integration

## License

MIT
