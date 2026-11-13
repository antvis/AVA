**English** | [简体中文](./README.zh-CN.md)

<div align="center">
  <h1>AVA, AI-native Visual Analytics</h1>
  <img width="200" height="120" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original" alt="AVA logo">
</div>

<p align="center">
  <a href="https://ava.antv.vision">
    <img src="https://img.shields.io/badge/Website-2F54EB?style=for-the-badge" alt="Website" />
  </a>
  <a href="https://ava.antv.vision/documentation/">
    <img src="https://img.shields.io/badge/Docs-722ED1?style=for-the-badge" alt="Documentation" />
  </a>
  <a href="https://ava.antv.vision/ai/">
    <img src="https://img.shields.io/badge/AI%20Agent-EB2F96?style=for-the-badge" alt="AI Agent" />
  </a>
  <a href="https://sive.antv.antgroup.com/" title="A data analysis app built with AVA">
    <img src="https://img.shields.io/badge/Try%20Sive-13A8A8?style=for-the-badge" alt="Try Sive" />
  </a>
  <a href="https://github.com/antvis/ava">
    <img src="https://img.shields.io/badge/GitHub-000000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  <a href="https://ava.antv.vision/llms.txt">
    <img src="https://img.shields.io/badge/LLMS-FA8C16?style=for-the-badge" alt="llms" />
  </a>
</p>

[AVA](https://github.com/antvis/AVA) (<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*QzIsSrfsCW0AAAAAAAAAAAAADmJ7AQ/original" width="16" alt="AVA examples"> Visual Analytics) is a technology framework designed for more convenient visual analytics. **A** stands for AI-native, Automated, and Augmented; **VA** stands for Visual Analytics.

<p align="center">
  <img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*MMXYTJ0KhukAAAAAgEAAAAgAegfkAQ/original" width="100%" alt="AVA agent workflow: data access, schema inspection, profiling, metric definitions, analysis, visualization, and follow-up questions, with verifiable SQL and results." />
</p>

> [!NOTE]
> **Think of AVA as PandasAI for JavaScript. 💬📊🤖**
>
> It brings natural-language data analysis and visualization to your apps and AI agents.

## ✨ Why AVA?

<table width="100%">
  <tr>
    <td width="33%" valign="top">
      <h3>🔌 Analysis across data sources</h3>
      <p>Join data from files and databases <strong>in a single query</strong>.</p>
      <a href="https://ava.antv.vision/documentation/data/sources/#connect-multiple-sources">Connect multiple sources →</a>
    </td>
    <td width="33%" valign="top">
      <h3>🔎 Grounded answers</h3>
      <p>Inspect the <strong>queries and results</strong> behind each answer.</p>
      <a href="https://ava.antv.vision/documentation/analysis/overview/">Trusted analysis →</a>
    </td>
    <td width="33%" valign="top">
      <h3>📊 Smart visualization</h3>
      <p>Get charts guided by <strong>your question and data</strong>.</p>
      <a href="https://ava.antv.vision/documentation/visualization/overview/">Visualization →</a>
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <h3>💻 Local execution</h3>
      <p>Choose <strong>where analysis runs</strong> and which model endpoint it uses.</p>
      <a href="https://ava.antv.vision/documentation/engines/overview/">Execution engines →</a>
    </td>
    <td width="33%" valign="top">
      <h3>🎯 Published benchmarks</h3>
      <p>Check accuracy against <strong>reference answers</strong> under published test conditions.</p>
      <a href="https://ava.antv.vision/documentation/reference/benchmarks/">Benchmarks →</a>
    </td>
    <td width="33%" valign="top">
      <h3>🤖 Agent integration</h3>
      <p>Your agent reasons; <strong>AVA executes</strong> the data workflow.</p>
      <a href="https://ava.antv.vision/documentation/agent-skill/">Agent integration →</a>
    </td>
  </tr>
</table>

## 🚀 Getting started

Install AVA with Node.js 22.13+:

```bash
npm install @antv/ava
```

## 💻 Usage

Download [sales.csv](__tests__/datasets/sales.csv) and configure your model:

```typescript
import { AVA } from '@antv/ava';

const ava = new AVA({
  llm: {
    model: '<your-model>',
    apiKey: '<your-api-key>',
    // baseURL: '<your-provider-api-url>',
  },
});
```

### 1. Load

```typescript
await ava.source({ type: 'csv-file', options: { path: './sales.csv' } });
```

> [!NOTE]
> **Data preview**
>
> First 3 of 240 rows, selected columns:
>
> | order_date | product | sales |
> | --- | --- | ---: |
> | 2025-01-01 | Monitor | 224.10 |
> | 2025-01-02 | Office Chair | 680.20 |
> | 2025-01-04 | Monitor | 2,191.20 |

### 2. Explore

Inspect the structure and data quality, then add [business definitions](https://ava.antv.vision/documentation/data/semantic/):

```typescript
const schema = await ava.schema();
const profile = await ava.profile({ metrics: ['row_count', 'null_count'] });
await ava.semantic(undefined, () => ({
  description: 'Use the sales column for amounts after discounts and order_date for monthly comparisons.',
}));
```

> [!NOTE]
> **Analysis context**
>
> | Context | Details |
> | --- | --- |
> | Structure | `data`: 12 columns |
> | Quality | 240 rows; 1 missing `region` and 1 missing `quantity` |
> | Semantics | `sales` is after discounts; monthly comparisons use `order_date` |

### 3. Suggest

```typescript
const suggestions = await ava.suggest(3);
```

> [!NOTE]
> **Suggested questions** (examples)
>
> - How did sales change from January to February 2025?
> - Which products contributed most to the sales decline?
> - How do sales and profit vary by region?

### 4. Analyze

```typescript
const result = await ava.analyze(
  'Compare January and February 2025 sales by product. Show both months and the change, ordered by the largest decline.'
);
```

> [!NOTE]
> **Analysis result**
>
> Total sales fell **43.94%**, led by a **16,092.10** decline in laptop sales.
>
> First 3 of 9 products:
>
> | Product | January sales | February sales | Change |
> | --- | ---: | ---: | ---: |
> | Laptop | 19,688.10 | 3,596.00 | −16,092.10 |
> | Standing Desk | 9,655.80 | 5,546.10 | −4,109.70 |
> | Monitor | 6,536.25 | 4,731.00 | −1,805.25 |

### 5. Visualize

```typescript
const chart = await ava.visualize({
  query: 'Plot the sales change by product from January to February 2025 as a bar chart.',
  data: result.data,
});
```

> [!NOTE]
> **Chart preview**
>
> <img src=".github/assets/sales-change.png" width="800" alt="Sales change by product from January to February 2025, with decreases in red and increases in green.">
>
> *Powered by [GPT-Vis](https://gpt-vis.antv.vision/).*

## 🔌 Connect your data

<table width="100%">
  <tr>
    <td align="center" width="12.5%"><a href="https://ava.antv.vision/documentation/data/sources/#csv"><img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*SEIZRJCeCuYAAAAAQBAAAAgAegfkAQ/original" width="32" height="32" alt="CSV" /><br />CSV</a></td>
    <td align="center" width="12.5%"><a href="https://ava.antv.vision/documentation/data/sources/#json"><img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*VBNjQJDMvMIAAAAAHYAAAAgAegfkAQ/original" width="32" height="32" alt="JSON" /><br />JSON</a></td>
    <td align="center" width="12.5%"><a href="https://ava.antv.vision/documentation/data/sources/#parquet"><img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*-_h8RrPPA54AAAAAFkAAAAgAegfkAQ/original" width="32" height="32" alt="Parquet" /><br />Parquet</a></td>
    <td align="center" width="12.5%"><a href="https://ava.antv.vision/documentation/data/sources/#excel"><img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*GfCXT7Mb_5gAAAAAQCAAAAgAegfkAQ/original" width="32" height="32" alt="Excel" /><br />Excel</a></td>
    <td align="center" width="12.5%"><a href="https://ava.antv.vision/documentation/data/sources/#text"><img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*XrY8SK_9fGwAAAAAEsAAAAgAegfkAQ/original" width="32" height="32" alt="Text" /><br />Text</a></td>
    <td align="center" width="12.5%"><a href="https://ava.antv.vision/documentation/data/online-services/feishu-bitable/"><img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*Rly3Rou8Wv8AAAAAQFAAAAgAegfkAQ/original" width="32" height="32" alt="Feishu Bitable" /><br />Feishu Bitable</a></td>
    <td align="center" width="12.5%"><a href="https://ava.antv.vision/documentation/data/online-services/tencent-smartsheet/"><img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*wH-PT4nF70wAAAAAMkAAAAgAegfkAQ/original" width="32" height="32" alt="Tencent Docs" /><br />Tencent Docs</a></td>
    <td align="center" width="12.5%"><a href="https://ava.antv.vision/documentation/data/online-services/github/"><img src="site/public/logos/github.svg" width="32" height="32" alt="GitHub" /><br />GitHub</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://ava.antv.vision/documentation/data/sources/#sqlite"><img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*3xulRYi0wWkAAAAAQBAAAAgAegfkAQ/original" width="32" height="32" alt="SQLite" /><br />SQLite</a></td>
    <td align="center"><a href="https://ava.antv.vision/documentation/data/sources/#mysql"><img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*8TDeSpgXAi0AAAAAQEAAAAgAegfkAQ/original" width="32" height="32" alt="MySQL" /><br />MySQL</a></td>
    <td align="center"><a href="https://ava.antv.vision/documentation/data/sources/#postgresql"><img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*h6xsS5N0EbcAAAAAQFAAAAgAegfkAQ/original" width="32" height="32" alt="PostgreSQL" /><br />PostgreSQL</a></td>
    <td align="center"><a href="https://ava.antv.vision/documentation/data/sources/#sql-server"><img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*XVBPSaYT6p0AAAAAQJAAAAgAegfkAQ/original" width="32" height="32" alt="SQL Server" /><br />SQL Server</a></td>
    <td align="center"><a href="https://ava.antv.vision/documentation/data/sources/#mongodb"><img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*5VYbTakXL7EAAAAAIlAAAAgAegfkAQ/original" width="32" height="32" alt="MongoDB" /><br />MongoDB</a></td>
    <td align="center"><a href="https://ava.antv.vision/documentation/data/sources/#supabase"><img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*IWbeTqNDuu4AAAAAFFAAAAgAegfkAQ/original" width="32" height="32" alt="Supabase" /><br />Supabase</a></td>
    <td align="center"><a href="https://ava.antv.vision/documentation/data/sources/#clickhouse"><img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*o0VuQ5NvHZ8AAAAAELAAAAgAegfkAQ/original" width="32" height="32" alt="ClickHouse" /><br />ClickHouse</a></td>
    <td align="center"><a href="https://ava.antv.vision/documentation/data/sources/#snowflake"><img src="site/public/logos/snowflake.svg" width="32" height="32" alt="Snowflake" /><br />Snowflake</a></td>
  </tr>
</table>

> [!TIP]
> **Missing a data source? 💡🛠️**
>
> **[💬 Open an issue](https://github.com/antvis/AVA/issues/new/choose)** · **[🛠️ Submit a pull request](https://github.com/antvis/AVA/compare)**

## 🎯 Benchmarks

We evaluate AVA on established benchmarks to measure the accuracy and efficiency of its data analysis.

<img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*XjhtSbWcb70AAAAAUlAAAAgAegfkAQ/original" width="100%" alt="DataBench and Spider2-Lite evaluation results comparing raw data, schema and profile, and semantic context.">

[Evaluation setup and reports →](https://ava.antv.vision/documentation/reference/benchmarks/)

## 🧩 More ways to use AVA

### Use with an Agent

Ask your AI agent:

```text
Install the AVA skill with `npx skills add antvis/AVA`, then follow its setup instructions.
```

[Agent setup guide →](https://ava.antv.vision/documentation/agent-skill/)

### Use from the CLI

Load and analyze data from your terminal:

```bash
ava source ./sales.csv
ava analyze '<dataset-id>' 'Compare January and February 2025 sales by product.'
```

See the [CLI guide](https://ava.antv.vision/documentation/reference/cli/) for setup and commands.

## 📚 Resources

- [Documentation](https://ava.antv.vision/documentation/) — Guides and examples
- [Analysis strategies](https://ava.antv.vision/documentation/analysis/strategies/) — Direct and loop execution
- [API Reference](https://ava.antv.vision/documentation/reference/api/) — Methods and configuration
- [AI](https://ava.antv.vision/ai/) — Try out AVA in the browser environment
- [Benchmarks](https://ava.antv.vision/documentation/reference/benchmarks/) — Evaluation results
- [Issues](https://github.com/antvis/AVA/issues) — Bug reports and feature requests

## 🤝🛠️ Contributing

Contributions are welcome. Include tests, examples, and documentation with new features.

Run `npm test` to test your changes. For model-backed tests, copy `.env.example` to `.env` and add your model settings.

## 📑 Papers

[VizLinter](https://vegalite-linter.idvxlab.com/) - Chen, Q., Sun, F., Xu, X., Chen, Z., Wang, J. and Cao, N., 2021. VizLinter: A Linter and Fixer Framework for Data Visualization. *IEEE transactions on visualization and computer graphics*, 28(1), pp.206-216.

[《数据可视化设计的类型学实践》（Exploring the Typology of Visualization Design）](https://oversea.cnki.net/KCMS/detail/detail.aspx?dbcode=CJFD&dbname=CJFDAUTO&filename=MSDG202203021&uniplatform=OVERSEAS_EN&v=HcZsiecIxauSoKEB1s92_BImgnrMiazYsfZUpb-gcl0zXYx_MEwv5alz1UgtPjz1) - 蓝星宇, 王嘉喆. 数据可视化设计的类型学实践, 《美术大观》, 2022(3), 149-152.

## ⚖️ License

MIT
