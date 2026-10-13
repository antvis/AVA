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

<a href="https://gw.alipayobjects.com/v/huamei_qa8qxu/afts/video/A*6Mf-SpWDar0AAAAAiPAAAAgAemJ7AQ">
  <img width="1236" alt="Watch the AVA demo video" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*X7EmQKOrfmsAAAAAgGAAAAgAemJ7AQ/original" />
</a>

<p align="center">
  <a href="https://sive.antv.antgroup.com/">
    <img src="https://img.shields.io/badge/Try_Sive-2F54EB?style=for-the-badge" height="32" alt="Try Sive" />
  </a>
  <br />
  <sub>Built with AVA</sub>
</p>

With AVA, you can:

- 🤖 **Agent and SDK Integration**: Bring data analysis to your agents and applications through the AVA Skill, CLI, or TypeScript SDK.
- 💬 **Natural Language Analysis**: Turn questions into executable queries, structured results, and natural-language summaries.
- 📊 **Visualization**: Recommend chart types and generate GPT-Vis specifications and HTML visualizations from analysis results.
- 🔎 **Data Profiling**: Inspect tables and fields, and compute statistics such as missing-value counts, value ranges, and averages without an LLM call.
- 💡 **Query Suggestions**: Discover useful analysis questions based on your data's schema and optional statistics.
- 🌐 **Multiple Execution Environments**: Use DuckDB, Python/pandas, or remote database engines in Node.js, and JavaScript for inline data in browsers.
- 🧩 **Composable Workflows**: Combine data loading, schema inspection, direct queries, and chart rendering, with a custom Python executor when needed.

**🔌 Data Sources** — Connect files and databases, or load inline data.

<table width="100%">
  <tr>
    <td align="center" width="25%"><img src="site/public/logos/csv.svg" width="32" height="32" alt="CSV" /><br />CSV</td>
    <td align="center" width="25%"><img src="site/public/logos/json.svg" width="32" height="32" alt="JSON" /><br />JSON</td>
    <td align="center" width="25%"><img src="site/public/logos/parquet.svg" width="32" height="32" alt="Parquet" /><br />Parquet</td>
    <td align="center" width="25%"><img src="site/public/logos/excel.svg" width="32" height="32" alt="Excel" /><br />Excel</td>
  </tr>
  <tr>
    <td align="center"><img src="site/public/logos/sqlite.svg" width="32" height="32" alt="SQLite" /><br />SQLite</td>
    <td align="center"><img src="site/public/logos/mysql.svg" width="32" height="32" alt="MySQL" /><br />MySQL</td>
    <td align="center"><img src="site/public/logos/postgresql.svg" width="32" height="32" alt="PostgreSQL" /><br />PostgreSQL</td>
    <td align="center"><img src="site/public/logos/mongodb.svg" width="32" height="32" alt="MongoDB" /><br />MongoDB</td>
  </tr>
  <tr>
    <td align="center"><img src="site/public/logos/clickhouse.svg" width="32" height="32" alt="ClickHouse" /><br />ClickHouse</td>
    <td align="center"><img src="site/public/logos/supabase.svg" width="32" height="32" alt="Supabase" /><br />Supabase</td>
    <td align="center"><img src="site/public/logos/text.svg" width="32" height="32" alt="Text extraction" /><br />Text (LLM)</td>
    <td align="center"><a href="#-developer-contributions"><img src="site/public/logos/contribute.svg" width="32" height="32" alt="Contribute a data source" /><br />Contribute</a></td>
  </tr>
</table>

Support varies by engine. See the [data source guide](skills/ava/references/sources.md) for connection details.

## 🚀 Quick Start

Start with the TypeScript library below, or use AVA [with an agent](#use-with-an-agent) or [from the CLI](#use-from-the-cli).
Full configuration and method details are in the [API Reference](API_REFERENCE.md).
Replace placeholders such as `<your-data.csv>` with your own data, fields, and model settings.

### Installation

Requires Node.js 22.13+ for the examples below:

```bash
npm install @antv/ava@alpha
```

### Usage

Load your data, ask a question, and generate a chart:

```typescript
import { writeFile } from 'node:fs/promises';
import { AVA } from '@antv/ava';

const ava = new AVA({
  llm: {
    model: '<your-model>',
    apiKey: '<your-api-key>',
    baseURL: '<your-model-api-base-url>', // Omit for OpenAI.
  },
});

try {
  await ava.source({ type: 'csv-file', options: { path: '<your-data.csv>' } });

  // Ask a question about your data.
  const result = await ava.analyze('Compare <your-metric> by <your-dimension>');
  console.log(result.text);

  // Visualize the analysis result.
  const chart = await ava.visualize(result);
  if (chart) await writeFile('chart.html', chart.html);
} finally {
  await ava.dispose();
}
```

Open `chart.html` in your browser if a chart was generated.
See [API Reference](API_REFERENCE.md#sdk-reference) for other data sources and execution environments.

### Use with an Agent

Give your AI agent access to AVA:

```bash
npx skills add antvis/AVA
```

Start a new agent session and ask:

```text
Use the AVA skill to analyze <your-data.csv>, compare <your-metric> by <your-dimension>, and generate a chart.
```

The agent uses its own reasoning; AVA does not need a separate model API key for this workflow.
See [agent setup](API_REFERENCE.md#-use-with-ai-agents) for more details.

### Use from the CLI

Requires Node.js 22.13+ on macOS or Linux. Install AVA and configure a model for natural-language analysis:

```bash
npm install -g @antv/ava@alpha

export OPENAI_API_KEY='<your-api-key>'
export OPENAI_MODEL='<your-model>'
# Set this when using another OpenAI-compatible provider:
export OPENAI_BASE_URL='<your-model-api-base-url>'

ava source '<your-data.csv>'

# Replace <your-dataset-id> with the ID returned by ava source.
ava analyze '<your-dataset-id>' 'Compare <your-metric> by <your-dimension>'
ava dispose '<your-dataset-id>'
```

The result includes the computed data and a natural-language summary.
See the [CLI reference](API_REFERENCE.md#cli-reference) for direct queries, charts, and other commands.

## 📚 Resources

- [Documentation](https://ava.antv.vision/documentation/) for guides to getting started and building with AVA.
- [API Reference](API_REFERENCE.md) for a comprehensive technical reference.
- [Playground](https://ava.antv.vision/#playground) for exploring AVA through interactive examples.
- [Issues](https://github.com/antvis/AVA/issues) for bug reports and feature requests.
- [Benchmarks](evals/ACCURACY.md) for evaluation results and methodology.

## 🌐 Environment Support

### Node.js

Uses DuckDB by default, with optional Python and remote database engines:

- Inline data (csv/json/text), local/remote files (csv-file/json-file/parquet/excel), DuckDB-attached databases (mysql/postgresql), and direct ClickHouse sources via `load`
- File system access for CSV loading, plus remote files such as OSS signed URLs
- With DuckDB, file data is read directly by the engine without materializing it in JavaScript memory
- Database sources ATTACH through DuckDB's mysql/postgres extensions; every table is auto-discovered and exposed to the LLM (with optional SSH tunneling)
- Supabase engine for remote SQL execution via Supabase Management API
- ClickHouse engine for remote SQL execution via the official client
- Python engine for pandas analysis of inline CSV/JSON and file sources; requires `python3` and pandas for local execution

### Browser

Lightweight JavaScript interpreter engine for client-side analytics:

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
