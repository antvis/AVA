# Notion database → AVA

Read one authorized Notion database into AVA's DuckDB engine, then analyze it using natural language. The connector calls only the Notion REST `GET /v1/databases/:id` (retrieve schema) and `POST /v1/databases/:id/query` (read pages) endpoints. It never exposes a page write or create/update/delete operation, so a model routed through AVA can modify no source data.

## Platform research and authorization

Notion is a collaboration workspace. Its typed database properties (status, number, select, date, checkbox, people, …) suit task tracking, CRM, and operations reporting.

- [Notion API overview and pagination](https://developers.notion.com/reference/intro)
- [Retrieve a database](https://developers.notion.com/reference/retrieve-a-database)
- [Query a database](https://developers.notion.com/reference/post-database-query)
- [Page property values](https://developers.notion.com/reference/page-property-values)

Create an integration at https://www.notion.so/profile/integrations and copy its internal integration token. The integration must be a member of the database's parent page and have read access to the database. This implementation accepts a user-provided token; it does not implement an OAuth callback or automatic refresh. A token with write access is still read-only through this connector because only the two retrieve/query endpoints are called.

## Setup

Requires Node.js 22.13+. From the repository root:

```sh
npm install
npm run build
```

If npm 10.9.4 fails while resolving the existing development peer dependency tree with `Cannot read properties of null (reading 'edgesOut')`, the tested local workaround is `npm install --legacy-peer-deps`.

Create an untracked `.env.local` at the repository root:

```dotenv
NOTION_DATABASE_ID=<database-id>
NOTION_TOKEN=<integration token>
OPENAI_API_KEY=<model API key>
OPENAI_MODEL=<model available from your provider>
OPENAI_BASE_URL=<optional OpenAI-compatible endpoint>
```

`.env.local` is ignored by Git. AVA does not implicitly load it: the commands below use Node's explicit `--env-file`. Credentials supplied through `options.token` override `NOTION_TOKEN`. The database id from the environment is used by the example scripts; SDK source options still require `databaseId`.

### SDK

```javascript
import { AVA } from '@antv/ava';

const ava = new AVA({ llm: {
  model: process.env.OPENAI_MODEL,
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
} });
try {
  await ava.source({ type: 'notion', options: { databaseId: process.env.NOTION_DATABASE_ID } });
  console.log(await ava.schema());
  const result = await ava.analyze('按状态统计每个状态的任务数量和金额总和');
  console.table(result.data);
} finally {
  await ava.dispose();
}
```

The model must be configured for natural-language analysis, but loading, schema discovery and direct SQL do not call a model. The connector works with the Node.js DuckDB engine, not the browser, Python or JavaScript engines.

### CLI

Replace the id in `source.json` with your own, leaving the token in the environment:

```sh
node --env-file=.env.local lib/cli/index.js source @examples/notion/source.json
node lib/cli/index.js schema <datasetId>
node lib/cli/index.js analyze <datasetId> "按状态统计每个状态的任务数量和金额总和"
node lib/cli/index.js dispose <datasetId>
```

The existing dataset-session CLI requires macOS/Linux. On Windows use the SDK or run the CLI in WSL. Windows CLI session support is not added by this integration.

## Supported properties and data semantics

| Notion property type | DuckDB type | Conversion |
| --- | --- | --- |
| `title`, `rich_text` | `VARCHAR` | Concatenate rich-text segments' `plain_text` in order; preserve whitespace and empty strings. |
| `number` | `DOUBLE` | Preserve the finite raw number; `0.75` remains `0.75`. |
| `select`, `status` | `VARCHAR` | Use the option's `name`; an empty selection is null. |
| `multi_select`, `people` | `VARCHAR` | Join option/user names with `, `; an empty array is null. |
| `date` | `TIMESTAMPTZ` | Use `date.start`; a concrete timestamp without a named zone is normalized to UTC. |
| `checkbox` | `BOOLEAN` | Preserve the boolean, including `false`. |
| `url`, `email`, `phone_number` | `VARCHAR` | Preserve the string, including leading zeros. |
| `created_time`, `last_edited_time` | `TIMESTAMPTZ` | Preserve the ISO string. |
| `created_by`, `last_edited_by` | `VARCHAR` | Use the user object's `name`. |
| `unique_id` | `VARCHAR` | Format as `PREFIX-NUMBER`. |
| `formula`, `rollup` | `DOUBLE` / `BOOLEAN` / `VARCHAR` | Follow the computed result type. |

Other property types (`files`, `relation`, `button`, `place`, `verification`) are not exposed in the first version. A database without supported properties fails. Original property names become column names; case-insensitive duplicates and the reserved `_id` name are rejected rather than silently renamed. `_id` preserves the source page id.

Omitted properties become null; pages with no populated properties are retained. Empty databases and all-null columns retain explicit SQL types. Invalid values for supported types fail the whole load rather than coercing them to incorrect numbers or null. Numbers use IEEE-754 doubles, not exact financial decimal arithmetic.

## Reliability and limits

| Option | Default | Range / behavior |
| --- | --- | --- |
| `pageSize` | 100 | 1–100 pages per request. |
| `maxRecords` | 10,000 | 1–100,000; exceeding it fails, never silently truncates. |
| `timeoutMs` | 60,000 | 1–110,000 ms across pagination and retries. |
| `maxRetries` | 2 | 0–5 per transient operation. |
| `version` | `2022-06-28` | Notion-Version request header. |

Property discovery is capped at 2,000 properties. Response streams and paginated reads are bounded at 16 MiB. Separately, the expanded snapshot is limited to 16 MiB of UTF-8 JSON (including column names, null cells, page ids, brackets and commas) and 1,000,000 cells (including `_id`). The effective record limit is the smaller of `maxRecords` and `floor(1000000 / (supported property count + 1))`; large sparse databases are rejected from their reported total before dense expansion. Validated pages are converted one at a time without retaining the entire raw page array. Each row must fit the remaining expanded budgets before it is retained; exceeding any budget fails the load, never truncates it.

Pages are fully cursor-paginated; the connector rejects invalid cursors, repeated page ids, changing totals and incomplete final pages. Property metadata is rechecked after the pages are read. Stop editing the source while importing: the provider does not offer a transactionally consistent multi-page snapshot, and same-count edits cannot all be detected. This is a load-time snapshot, not live synchronization.

HTTP 429/502/503/504 and network failures have bounded retries within the overall deadline. `Retry-After` waits over 30 seconds are not attempted. Authentication, permission and rate-limit failures are not retried. Upstream error codes and messages are retained alongside known-code hints. SDK/network failures preserve their error type, stack, and cause chain rather than being replaced by a generic failure. HTTP failures include status and up to 8 KiB of upstream response diagnostics (with truncation marked); `NotionError.code`, `.status` and `.cause` expose structured details to SDK callers. The configured token is redacted from diagnostic strings and nested error properties. The endpoint is fixed (`https://api.notion.com`). After loading, data is materialized in memory, so analysis does not whitelist a temporary directory.

## Reproduce the two business examples

Use a dedicated test database with these properties (the default names are intentionally retained):

| Property | Notion type | Example business meaning |
| --- | --- | --- |
| 名称 | `title` | Task title |
| 金额 | `number` | Estimated cost |
| 状态 | `status` | Task status; on/Completed 完成 options |
| 日期 | `date` | Due date |

`tasks.json` contains six fictional tasks. Enter them manually in a fresh database (this example does not include a write script; Notion pages are created in the Notion UI).

Verify paging and exact SQL results without a model:

```sh
node --env-file=.env.local examples/notion/analyze.mjs --verify-only
```

Run real natural-language analysis and assertions with your model:

```sh
node --env-file=.env.local examples/notion/analyze.mjs
```

Both modes deliberately use `pageSize: 2` to exercise pagination. Natural-language questions request stable result aliases so the numerical assertions can run automatically. The test checks actual computed data, not whether an LLM judges its own answer correct.

1. **Status aggregation:** How many tasks does each status have, and what is the total estimated cost per status? Expected: 已完成 3 tasks / 380; 进行中 3 tasks / 330.
2. **Monthly trend:** How do task count and total cost change between January and February 2026? Expected: 400 → 310.

## Tests

Offline unit/integration tests use mock Notion REST responses and a real in-memory DuckDB; no network or credentials are needed:

```sh
npx vitest run notion
```

Do not commit credentials, real database ids or private source records. In a real deployment, confirm which data/schema/profile the configured model receives before using business data; these examples use only synthetic tasks.