# Tencent Docs SmartSheet → AVA

Read one authorized Tencent Docs SmartSheet table into AVA's DuckDB engine, then analyze it using natural language. The connector calls only `smartsheet.list_fields` and `smartsheet.list_records`. It does not expose the remote tool catalog to the model and cannot write source records.

## Platform research and authorization

Tencent Docs is a collaboration SaaS. SmartSheet's typed business records are suitable for sales aggregation, project tracking, and operational reporting. Its official Streamable HTTP MCP endpoint is `https://docs.qq.com/openapi/mcp`.

- [Official MCP overview, authorization guide link, and daily quotas](https://docs.qq.com/open/document/mcp/)
- [Official MCP error codes](https://docs.qq.com/open/document/mcp/error-code/)
- [SmartSheet concepts](https://docs.qq.com/open/document/app/openapi/v2/smartsheet/common/concept.html)

Sign in with QQ/WeChat and follow the MCP usage guide linked from the official overview to obtain an MCP token. The signed-in account must have access to the target document. Use a dedicated test account/document where possible. This implementation accepts a user-provided token; it does not implement an OAuth callback or automatic refresh. Tencent Docs MCP and its older REST API use different field contracts: the MCP `field_type` values tested here are string enums, not the numeric REST enums.

As documented on the official MCP page when checked on 2026-11-02, daily tool-call quotas are 2,000 for free users, 20,000 for Super Members and 40,000 for Super Member Plus. These are provider policies, not guarantees by AVA; check the current official limits before a large import. Daily quota exhaustion fails immediately rather than repeatedly consuming calls.

## Setup

Requires Node.js 22.13+. From the repository root:

```sh
npm install
npm run build
```

If npm 10.9.4 fails while resolving the existing development peer dependency tree with `Cannot read properties of null (reading 'edgesOut')`, the tested local workaround is `npm install --legacy-peer-deps`.

Create an untracked `.env.local` at the repository root:

```dotenv
TENCENT_DOCS_TOKEN=<MCP Authorization value>
TENCENT_DOCS_FILE_ID=<file_id>
TENCENT_DOCS_SHEET_ID=<sheet_id>
OPENAI_API_KEY=<model API key>
OPENAI_MODEL=<model available from your provider>
OPENAI_BASE_URL=<optional OpenAI-compatible endpoint>
```

Use the exact Authorization value from Tencent Docs (do not unconditionally add `Bearer `). Use the MCP `file_id`; an encoded document ID accepted by MCP also works. Obtain `sheet_id` by calling the read-only `smartsheet.list_tables` tool in your MCP client. IDs are explicit in this version: AVA does not resolve sharing URLs, search personal files, or guess a table when a document contains several.

`.env.local` is ignored by Git. AVA does not implicitly load it: the commands below use Node's explicit `--env-file`. Credentials supplied through `options.token` override `TENCENT_DOCS_TOKEN`. IDs from the environment are used by the example scripts; SDK source options still require `fileId` and `sheetId`.

### SDK

```javascript
import { AVA } from '@antv/ava';

const ava = new AVA({ llm: {
  model: process.env.OPENAI_MODEL,
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
} });
try {
  await ava.source({ type: 'tencent-docs-smartsheet', options: {
    fileId: process.env.TENCENT_DOCS_FILE_ID,
    sheetId: process.env.TENCENT_DOCS_SHEET_ID,
  } });
  console.log(await ava.schema());
  const result = await ava.analyze('按地区统计销售额，按销售额降序排列。');
  console.table(result.data);
} finally {
  await ava.dispose();
}
```

The model must be configured for natural-language analysis, but loading, schema discovery and direct SQL do not call a model. The connector works with the Node.js DuckDB engine, not the browser, Python or JavaScript engines.

### CLI

Replace the IDs in `source.json` with your own, leaving the token in the environment:

```sh
node --env-file=.env.local lib/cli/index.js source @examples/tencent-docs/source.json
node lib/cli/index.js schema <datasetId>
node lib/cli/index.js analyze <datasetId> "按地区统计销售额"
node lib/cli/index.js dispose <datasetId>
```

The existing dataset-session CLI requires macOS/Linux. On Windows use the SDK or run the CLI in WSL. Windows CLI session support is not added by this integration.

On Linux/macOS, verify actual child-process sessions without installing a global `ava` command:

```sh
node --env-file=.env.local examples/tencent-docs/cli-e2e.mjs
# Also run the two real natural-language questions (uses the configured model):
node --env-file=.env.local examples/tencent-docs/cli-e2e.mjs --with-model
```

The script checks `source → schema → query → analyze → dispose`, asserts fixture results, and verifies the session is unavailable after disposal. It creates only a temporary local config file; it does not write the Tencent Docs source table. Without `--with-model`, analysis is omitted and no model calls are made.

## Supported fields and data semantics

| MCP `field_type` | DuckDB type | Conversion |
| --- | --- | --- |
| `text` | `VARCHAR` | Concatenate `text_value.items[].text` in order; preserve whitespace and empty strings. |
| `number`, `currency`, `percentage`, `progress` | `DOUBLE` | Preserve the finite raw `number_value`; do not apply display formatting. `0.75` remains `0.75`. |
| `checkbox` | `BOOLEAN` | Preserve `bool_value`, including `false`. |
| `dateTime`, `createdTime`, `modifiedTime` | `TIMESTAMPTZ` | Parse the millisecond Unix timestamp in `string_value` and normalize to UTC. |
| `singleSelect` | `VARCHAR` | Use the single option's text. An empty selection is null. |
| `phoneNumber`, `email` | `VARCHAR` | Preserve `string_value`, including leading zeros. |

Other field types (images, attachments, users, multi-select, links, formulas, lookup and other complex/computed columns) are not exposed in the first version. `include_computed_values` is not enabled. A table without supported fields fails. The original field titles become column names; case-insensitive duplicates and the reserved `_record_id` name are rejected rather than silently renamed. `_record_id` preserves the source record identity.

Omitted cell values become null; rows with no populated cells are retained. Empty tables and all-null columns retain explicit SQL types. Invalid values for supported types fail the whole load rather than coercing them to incorrect numbers or null. Numbers use IEEE-754 doubles, not exact financial decimal arithmetic.

## Reliability and limits

| Option | Default | Range / behavior |
| --- | --- | --- |
| `pageSize` | 100 | 1–100 records per request. Field pages use 100. |
| `maxRecords` | 10,000 | 1–100,000; exceeding it fails, never silently truncates. |
| `timeoutMs` | 60,000 | 1–110,000 ms across connection, pagination and retries. |
| `maxRetries` | 2 | 0–5 per transient operation. |

Field discovery is capped at 1,000 fields. Response streams and paginated reads are bounded at 16 MiB. Separately, the expanded snapshot is limited to 16 MiB of UTF-8 JSON (including column names, null cells, record IDs, brackets and commas) and 1,000,000 cells (including `_record_id`). The effective record limit is the smaller of `maxRecords` and `floor(1000000 / (supported field count + 1))`; large sparse tables are rejected from their reported total before dense expansion. Validated record pages are converted one row at a time without retaining the entire raw record array. Each row must fit the remaining expanded budgets before it is retained; exceeding any budget fails the load, never truncates it.

Fields and records are fully paginated; the connector rejects invalid offsets, duplicate IDs, changing totals and incomplete final pages. Supported field metadata is rechecked after the records are read. Stop editing the source while importing: the provider does not offer a transactionally consistent multi-page snapshot, and same-count edits cannot all be detected. This is a load-time snapshot, not live synchronization.

HTTP 429/502/503/504 and network failures have bounded retries within the overall deadline. `Retry-After` waits over 30 seconds are not attempted. Tool error 400010 is retried; authentication, permission and daily quota errors are not. Raw provider error text is not exposed because it may contain private data. The endpoint is fixed, and redirects are refused. Temporary source files are created exclusively with mode `0600` before any contents are written; existing files/symlinks are never overwritten, and failed writes clean up their own partial file. After loading, data is materialized in memory and its temporary JSON file is deleted, so analysis does not whitelist a temporary directory.

## Reproduce the two business examples

Use a dedicated test SmartSheet with these fields (the default names are intentionally retained):

| Field title | MCP type | Example business meaning |
| --- | --- | --- |
| 文本 | `text` | Product |
| 数字 | `number` | Order sales amount |
| 单选 | `singleSelect` | Region; allow the 华东 / 华西 options |
| 日期 | `dateTime` | Order date |

`sales.json` contains eight fictional orders. To **explicitly append** these fixtures:

```sh
node --env-file=.env.local examples/tencent-docs/seed.mjs --seed
```

This optional setup script is separate from the read-only connector. It never changes/deletes existing rows, refuses to reseed when an `AVA-DEMO-` marker exists, and never retries writes automatically. If a write response is lost, inspect the table before retrying. You may alternatively enter the eight orders manually. The synthetic product marker scopes all checks, so unrelated/empty rows are excluded from the business examples.

Verify paging and exact SQL results without a model:

```sh
node --env-file=.env.local examples/tencent-docs/analyze.mjs --verify-only
```

Run real natural-language analysis and assertions with your model:

```sh
node --env-file=.env.local examples/tencent-docs/analyze.mjs
```

Both modes deliberately use `pageSize: 2` to exercise pagination. Natural-language questions request stable result aliases so the numerical assertions can run automatically. The test checks actual computed data, not whether an LLM judges its own answer correct.

1. **Regional contribution:** Which region has the highest sales, and how many orders does each region have? Expected: 华西, 4 orders, 550; 华东, 4 orders, 350.
2. **Monthly sales change:** How did sales change from January to February 2026? Expected: 500 → 400, change −100, percentage change −20%.

See [VALIDATION.md](./VALIDATION.md) for the tested environment and results.

## Tests

Offline unit/integration tests use mock MCP responses and a real in-memory DuckDB; no network or credentials are needed:

```sh
npx vitest run tencent
```

An explicit opt-in live read test checks the seeded table without calling an LLM:

```sh
# Put AVA_TENCENT_INTEGRATION=1 in your untracked local env file to enable it.
node --env-file=.env.local node_modules/vitest/vitest.mjs run __tests__/duckdb/loaders/tencent-live.test.ts
```

Do not commit credentials, real document IDs or private source records. In a real deployment, confirm which data/schema/profile the configured model receives before using business data; these examples use only synthetic orders.
