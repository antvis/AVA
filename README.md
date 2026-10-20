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
  <a href="https://ava.antv.vision/documentation/">
    <img src="https://img.shields.io/badge/Docs-722ED1?style=for-the-badge" alt="Documentation" />
  </a>
  <a href="https://ava.antv.vision/ai/">
    <img src="https://img.shields.io/badge/AI%20Agent-EB2F96?style=for-the-badge" alt="AI Agent" />
  </a>
  <a href="https://ava.antv.vision/llms.txt">
    <img src="https://img.shields.io/badge/LLMS-FA8C16?style=for-the-badge" alt="llms" />
  </a>
  <a href="https://sive.antv.antgroup.com/" title="A data analysis app built with AVA">
    <img src="https://img.shields.io/badge/Try%20Sive-13A8A8?style=for-the-badge" alt="Try Sive" />
  </a>
</p>

<p align="center">
  <img width="800" alt="AVA demo" src=".github/assets/demo.gif" />
</p>

## ✨ Features

- 💬 **[Natural-language analysis](https://ava.antv.vision/documentation/analysis/overview/)** — Turn questions into executable queries, computed results, and summaries.
- 📊 **[Visualization](https://ava.antv.vision/documentation/visualization/overview/)** — Recommend chart types and generate chart specifications and HTML.
- 🔍 **[Data profiling](https://ava.antv.vision/documentation/data/schema/#profile-a-dataset)** — Inspect tables and calculate missing-value counts, ranges, and averages.
- 💡 **[Question suggestions](https://ava.antv.vision/documentation/analysis/overview/#suggest-questions)** — Discover useful questions based on your data's structure and available statistics.
- 🔌 **[App and agent integration](https://ava.antv.vision/documentation/agent-skill/)** — Use AVA through its SDK, CLI, or agent skill.
- ⚙️ **[Multiple execution engines](https://ava.antv.vision/documentation/engines/overview/)** — Use DuckDB, Python/pandas, or remote databases in Node.js, and JavaScript in browsers.
- 🧩 **[Composable workflows](https://ava.antv.vision/documentation/analysis/overview/#translate-and-execute-separately)** — Combine data loading, query generation, direct queries, and chart rendering.

## 🚀 Getting started

### 📦 Installation

Install the v4 beta with Node.js 22.13+:

```bash
npm install @antv/ava@beta
```

### 💻 Usage

Investigate a monthly sales decline: measure the change, identify the largest contributors, and visualize the breakdown.

#### Load data

Download [sales.csv](__tests__/datasets/sales.csv) to your working directory. The sample contains 240 orders across 2025, with products, regions, channels, sales, and profit.

```typescript
import { AVA } from '@antv/ava';

const ava = new AVA({
  llm: {
    model: '<your-model>',
    apiKey: '<your-api-key>',
    // baseURL: '<your-provider-api-url>',
  },
});

await ava.source({ type: 'csv-file', options: { path: './sales.csv' } });
```

#### Ask questions

Measure the overall change using `sales`, the amount after discounts:

```typescript
const overview = await ava.analyze(`
  Compare total sales in January and February 2025 using the sales column.
  Include the change and percentage change.
`);
console.log(overview.text);
```

Expected: sales fell from **38,897.18 to 21,804.11**, down **17,093.07 (43.94%)**.

Find the products contributing to the decline:

```typescript
const result = await ava.analyze(`
  Compare January and February 2025 sales by product using the sales column.
  Show both months and the change, ordered by the largest decline.
`);
console.log(result.text);
console.table(result.data);
```

Expected breakdown:

| Product | January sales | February sales | Change |
| --- | ---: | ---: | ---: |
| Laptop | 19,688.10 | 3,596.00 | −16,092.10 |
| Standing Desk | 9,655.80 | 5,546.10 | −4,109.70 |
| Monitor | 6,536.25 | 4,731.00 | −1,805.25 |
| Pen Set | 232.20 | 127.71 | −104.49 |
| Bookshelf | 1,225.50 | 1,251.30 | +25.80 |
| Copy Paper | 59.19 | 137.06 | +77.87 |
| Notebook | 31.50 | 137.03 | +105.53 |
| Keyboard | 215.64 | 1,015.31 | +799.67 |
| Office Chair | 1,253.00 | 5,262.60 | +4,009.60 |

Laptops contributed the largest decline, while office chairs delivered the largest increase.

<!-- Image placeholder: monthly sales comparison, 43.94% decline, and product contribution table. -->

#### Visualize charts

Chart each product's contribution to the sales change:

```typescript
import { writeFile } from 'node:fs/promises';

const chart = await ava.visualize({
  query: 'Plot the sales change by product from January to February 2025 as a bar chart.',
  data: result.data,
});
if (chart) {
  await writeFile('sales-change.html', chart.html);
}
```

Open `sales-change.html` in a browser with internet access.

<img src=".github/assets/sales-change.png" width="600" alt="Sales change by product from January to February 2025, with decreases in red and increases in green.">

#### Find questions to explore

Get suggested questions for your data:

```typescript
const suggestions = await ava.suggest();
console.log(suggestions);
```

> 💡 **Suggested questions**
>
> How do sales change month by month?
>
> Which products contribute the most profit?
>
> How do sales compare across channels?

#### Understand your data

Check missing values and sales ranges:

```typescript
console.log(await ava.schema());
console.log(await ava.profile({ metrics: ['row_count', 'null_count', 'min', 'max'] }));
```

The sample has one missing `region` and one missing `quantity`.

Release resources when finished:

```typescript
await ava.dispose();
```

## 🔌 Connect your data

Connect files and databases, or load inline data.

<table width="100%">
  <tr>
    <td align="center" width="25%"><a href="https://ava.antv.vision/documentation/data/sources/#csv"><img src="site/public/logos/csv.svg" width="32" height="32" alt="CSV" /><br />CSV</a></td>
    <td align="center" width="25%"><a href="https://ava.antv.vision/documentation/data/sources/#json"><img src="site/public/logos/json.svg" width="32" height="32" alt="JSON" /><br />JSON</a></td>
    <td align="center" width="25%"><a href="https://ava.antv.vision/documentation/data/sources/#parquet"><img src="site/public/logos/parquet.svg" width="32" height="32" alt="Parquet" /><br />Parquet</a></td>
    <td align="center" width="25%"><a href="https://ava.antv.vision/documentation/data/sources/#excel"><img src="site/public/logos/excel.svg" width="32" height="32" alt="Excel" /><br />Excel</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://ava.antv.vision/documentation/data/sources/#sqlite"><img src="site/public/logos/sqlite.svg" width="32" height="32" alt="SQLite" /><br />SQLite</a></td>
    <td align="center"><a href="https://ava.antv.vision/documentation/data/sources/#mysql"><img src="site/public/logos/mysql.svg" width="32" height="32" alt="MySQL" /><br />MySQL</a></td>
    <td align="center"><a href="https://ava.antv.vision/documentation/data/sources/#postgresql"><img src="site/public/logos/postgresql.svg" width="32" height="32" alt="PostgreSQL" /><br />PostgreSQL</a></td>
    <td align="center"><a href="https://ava.antv.vision/documentation/data/sources/#mongodb"><img src="site/public/logos/mongodb.svg" width="32" height="32" alt="MongoDB" /><br />MongoDB</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://ava.antv.vision/documentation/data/sources/#clickhouse"><img src="site/public/logos/clickhouse.svg" width="32" height="32" alt="ClickHouse" /><br />ClickHouse</a></td>
    <td align="center"><a href="https://ava.antv.vision/documentation/data/sources/#supabase"><img src="site/public/logos/supabase.svg" width="32" height="32" alt="Supabase" /><br />Supabase</a></td>
    <td align="center"><a href="https://ava.antv.vision/documentation/data/sources/#text"><img src="site/public/logos/text.svg" width="32" height="32" alt="Text extraction" /><br />Text (LLM)</a></td>
    <td align="center"><a href="https://ava.antv.vision/documentation/engines/custom/"><img src="site/public/logos/contribute.svg" width="32" height="32" alt="Custom engine" /><br />Custom engine</a></td>
  </tr>
</table>

Load an Excel workbook with `source()`:

```typescript
await ava.source({ type: 'excel', options: { path: './sales.xlsx' } });
```

See the [data source guide](https://ava.antv.vision/documentation/data/sources/) for connection settings and engine support.

For browser applications, use `@antv/ava/browser` with inline data. See [runtime configuration](https://ava.antv.vision/documentation/browser/).

## 🧩 More ways to use AVA

The agent and CLI workflows run on Node.js 22.13+ on macOS or Linux.

### Use with an Agent

Your agent plans the analysis; AVA runs queries and creates charts.

```bash
npm install -g @antv/ava@beta
npx skills add antvis/AVA
```

In a new agent session, ask:

```text
Use the AVA skill to analyze ./sales.csv. Compare January and February 2025
sales, identify the products contributing most to the change, and save a chart.
```

This workflow uses your agent's existing model. See [agent setup](https://ava.antv.vision/documentation/agent-skill/).

### Semantic layer strategy

The `semantic` strategy implements the architecture described in [the semantic-layer-mediated NL2SQL paper](https://arxiv.org/abs/2606.31041). It is an independent implementation, not the authors' QUVI service or a reproduction of their benchmark score. You define semantic models and joins explicitly; the agent discovers them (`getModelDataElements`), compiles Semantic Model Queries into trusted SQL (`convertSmqToSql`, with a 5-row preview), and composes the final SQL (`execute`). The AI SDK `ToolLoopAgent` manages native tool calls and tool-result messages; the model endpoint must support tool calling. Each step permits one tool call, up to `maxSteps` (default 20). Compilation returns the selection mode (rows, distinct or aggregate), a suggested CTE name and preview truncation metadata. Tool input and pre-execution SQL validation errors allow correction within the step budget. Once final execution starts, success or failure ends the loop; database errors do not trigger SQL rewrites.

After discovery, the agent can instead call `cannotAnswer` with the missing information or ambiguity. This terminates without executing a substitute query; `analyze()` rejects with an error named `InsufficientInformationError` whose message explains the limitation. The last step permits either `execute` or `cannotAnswer`. An ordinary empty query result remains a successful result.

The core preserves the query's columns and values, including arrays, NULLs and empty results. Row/byte limits are reported through `truncated` and `truncatedBy`; they do not cause the agent to shrink the query to fit. Application-specific answer validation belongs to the caller. SMQ inputs retain their existing semantics: row targets in `metrics` preserve duplicates without `group_by`; non-aggregate `group_by` returns distinct combinations.

```ts
ava.semantic({
  models: [
    {
      name: 'orders',
      table: 'orders',
      dimensions: [{ name: 'channel', column: 'channel' }, { name: 'status', column: 'status' }],
      measures: [{ name: 'amount', column: 'amount', description: 'Payment amount per order' }],
      metrics: [{ name: 'revenue', agg: 'sum', column: 'amount' }],
    },
  ],
  joins: [], // { from, to, keys: [{ from, to }], type?: 'left' | 'inner' }
});

// Pure and deterministic: no LLM, no database.
const { sql } = ava.compileSMQ({
  metrics: ['revenue'],
  filters: ["orders__status = 'paid'"],
  group_by: ['orders__channel'],
});

await ava.analyze('Paid revenue by channel', { strategy: { type: 'semantic', maxSteps: 20 } });
```

`ava.semantic()` also accepts YAML or JSON text. Dimensions describe grouping/filtering attributes; measures describe row-level quantities; metrics define aggregates or derived aggregate calculations. `column` is shorthand for a physical column, while `expr` accepts a physical SQL expression with `{TABLE}` as its table alias. Metrics can use `agg` plus `column`/`expr`, or a complete aggregate `expr`.

```yaml
models:
  - name: orders
    table: orders
    dimensions:
      - { name: channel, column: channel, description: Sales channel }
    measures:
      - { name: amount, expr: '{TABLE}."amount"', description: Payment amount per order }
    metrics:
      - { name: revenue, agg: sum, column: amount, description: Total payment amount }
      - name: average_order_amount
        expr: 'SUM({TABLE}."amount") / NULLIF(COUNT(*), 0)'
        description: Average payment amount per order
```

SMQ `metrics` is the target list: dimensions/measures use `model__element`, and unique predefined metrics may use a bare name (`revenue`). Qualified metrics (`orders__revenue`) remain supported; ambiguous bare names fail. Row targets without `group_by` preserve duplicate records. With aggregates, selected row expressions define the grouping; without aggregates, `group_by` returns distinct combinations. Measures are never implicitly summed: request a predefined aggregate metric to aggregate them. This explicit rule is AVA's choice where the paper does not specify the complete SMQ grammar. Row filters use `WHERE`; aggregate filters use `HAVING`.

Joins accept either physical `keys` or an `on` SQL predicate, for example `TRIM({FROM}."customer_id") = TRIM({TO}."id")`. A reversed left join becomes a right join to preserve the declared outer-join direction. Models expose business descriptions during discovery; physical table/column expressions are introduced by compilation. SQL expressions in semantic definitions are trusted, reviewed configuration and must use the target database's syntax.

The agent must discover models, compile and successfully preview SQL, then compose a final query. DuckDB validates tables and columns from the native SQL parse tree against successful compilations, including CTE/subquery scopes; unsupported constructs fail explicitly. This is a grounding check, not a database authorization boundary. SQL execution still applies the engine's read-only checks. Custom engines must implement `validateSemanticQuery`; `semantic` currently runs on the bundled DuckDB engine. Standalone compilation supports DuckDB, PostgreSQL, MySQL, ClickHouse, SQLite, BigQuery, Snowflake and ANSI identifier/literal rendering; it does not transpile configured SQL expressions or supply cloud connections.

The semantic agent forwards `llm.temperature`, `llm.maxOutputTokens` and `llm.providerOptions` to the model. Configure reasoning through the selected provider instead of disabling it in the shared workflow. The step budget counts all tool actions (including discovery), not just SMQ calls. Benchmark-specific answer formatting belongs in the evaluation question, not in the generic semantic prompt.

### Use from the CLI

Configure your model and load a CSV:

```bash
npm install -g @antv/ava@beta

export OPENAI_API_KEY='<your-api-key>'
export OPENAI_MODEL='<your-model>'
# export OPENAI_BASE_URL='<your-provider-api-url>'

ava source ./sales.csv
```

Use the dataset ID returned by `source`:

```bash
ava analyze '<your-dataset-id>' 'Compare January and February 2025 sales by product, including the change.'
ava dispose '<your-dataset-id>'
```

`analyze` returns the answer as JSON. `dispose` releases the dataset. See [all CLI commands](https://ava.antv.vision/documentation/reference/cli/).

## 📚 Resources

- [Documentation](https://ava.antv.vision/documentation/) — Guides and examples
- [Analysis strategies](https://ava.antv.vision/documentation/analysis/strategies/) — Direct, loop, and subset execution
- [API Reference](https://ava.antv.vision/documentation/reference/api/) — Methods and configuration
- [AI](https://ava.antv.vision/ai/) — Try out AVA in the browser environment
- [Benchmarks](https://ava.antv.vision/documentation/reference/benchmarks/) — Evaluation results
- [Issues](https://github.com/antvis/AVA/issues) — Bug reports and feature requests

## 🤝 Developer Contributions

Contributions are welcome. Include tests, examples, and documentation with new features.

Run `npm test` to test your changes. For model-backed tests, copy `.env.example` to `.env` and add your model settings.

## 🔗 Related Projects

- [GPT-Vis](https://github.com/antvis/GPT-Vis) - Visualization components
- [Chart Visualization Skills](https://github.com/antvis/chart-visualization-skills) - LLM skills for charts
- [Vercel AI SDK](https://sdk.vercel.ai/) - LLM integration

## 📑 Papers

[VizLinter](https://vegalite-linter.idvxlab.com/) - Chen, Q., Sun, F., Xu, X., Chen, Z., Wang, J. and Cao, N., 2021. VizLinter: A Linter and Fixer Framework for Data Visualization. *IEEE transactions on visualization and computer graphics*, 28(1), pp.206-216.

[《数据可视化设计的类型学实践》（Exploring the Typology of Visualization Design）](https://oversea.cnki.net/KCMS/detail/detail.aspx?dbcode=CJFD&dbname=CJFDAUTO&filename=MSDG202203021&uniplatform=OVERSEAS_EN&v=HcZsiecIxauSoKEB1s92_BImgnrMiazYsfZUpb-gcl0zXYx_MEwv5alz1UgtPjz1) - 蓝星宇, 王嘉喆. 数据可视化设计的类型学实践, 《美术大观》, 2022(3), 149-152.

## ⚖️ License

MIT
