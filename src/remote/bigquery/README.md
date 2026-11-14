# AVA Google BigQuery data source

A read-only [Google BigQuery][bigquery] remote engine for AVA v4. It discovers
table structure through dataset-scoped `INFORMATION_SCHEMA` views and executes
read-only GoogleSQL `SELECT` statements — data is never materialized locally.

## Architecture

```
BigQuerySourceOptions
        │  adapter: '@google-cloud/bigquery' (default) | 'mock'
        ▼
BigQueryEngine (src/remote/bigquery/engine.ts)
        │  creates a QueryConnector, forwards schema/profile/execute
        ▼
QueryConnector  (connector.ts)  ── interface: connect / query / close
   ├── bigquery-connector.ts   production driver via `@google-cloud/bigquery`
   └── mock.ts                 in-memory connector + minimal GoogleSQL interpreter
```

Files:

| File                  | Responsibility |
| --------------------- | -------------- |
| `engine.ts`           | `BigQueryEngine` — source → connector, schema/profile/execute, read-only validation, result row caps. |
| `schema.ts`           | `getBigQuerySchema` — flat `INFORMATION_SCHEMA` dataset views discovery (project/dataset/table → `tableReference`). |
| `profile.ts`          | Per-column metrics compiled into read-only GoogleSQL (compiled per table into one aggregate query). |
| `connector.ts`        | `QueryConnector` interface shared by both adapters. |
| `bigquery-connector.ts` | Production connector typed against `@google-cloud/bigquery` (`@google-cloud/bigquery` optionalDependency), loaded through a deferred dynamic import. |
| `mock.ts`             | In-memory connector + small read-only GoogleSQL subset (SELECT / WHERE / GROUP BY / HAVING / ORDER BY / LIMIT / aggregates). |
| `examples.ts`         | `BIGQUERY_TABLE_SEED` sales seed used by docs and tests. |

The dialect is registered in `src/query/bigquery.ts`, which also exports
`validateReadOnlyBigQuery` (rejects multi-statement / non-SELECT input). Public
queries execute the normalized original statement; no outer SQL wrapper is
added, so a top-level `ORDER BY` retains its semantics.

Name→table mapping follows BigQuery's hierarchy exactly: `Model` /
`tableReference` is `catalog` = project id, `schema` = dataset id, `table` =
table name (the dataset-scoped `INFORMATION_SCHEMA` catalog column).

## Connection

```typescript
import { AVA } from '@antv/ava';

const ava = new AVA({
  llm: { model: 'gpt-4o', apiKey: process.env.OPENAI_API_KEY },
  engine: { type: 'bigquery' },
});
await ava.source({
  type: 'bigquery',
  options: {
    projectId: 'my-analytics-project',
    dataset: 'sales',
    credentials:
      typeof process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON === 'string'
        ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
        : undefined,
  },
});
```

Required: `projectId`. Optional: `dataset` (needed for `schema()`/
`profile()`), `credentials` (service-account JSON object or JSON object
string), `clientEmail` + `privateKey`, `location`, `maxBytesBilled` (per-job
dry-run check + server-side `maximumBytesBilled`), `timeoutMs`,
`defaultRowLimit` (per-page `getQueryResults.maxResults`), `adapter`, `tables`.
Malformed credential JSON is rejected while `ava.source()` loads the source.
When no credentials are passed, the client uses application-default credentials
(ADC). Loading a source is not a live connectivity check: GCP authentication and
authorization are exercised by BigQuery API requests such as `schema()` and
`query()`. See the [site docs][docs] for the full table.

### Real GCP run

1. Install the optional SDK if your package manager omitted optional packages:
   `npm install @google-cloud/bigquery@^9.6.0`.
2. Use a dedicated service account with **BigQuery Data Viewer**
   (`roles/bigquery.dataViewer`) on the project or dataset and **BigQuery Job
   User** (`roles/bigquery.jobUser`) on the project. Do not grant Data Editor,
   Owner, or write permissions; local SQL validation is not an IAM boundary.
3. Configure ADC with `gcloud auth application-default login`, or point
   `GOOGLE_APPLICATION_CREDENTIALS` at the service-account JSON and omit
   `options.credentials`. Alternatively, pass that JSON through
   `options.credentials` as above.
4. Build AVA and run the snippet in Node.js. Call `ava.schema()` to inspect the
   dataset, then `ava.query('SELECT …')` or `ava.analyze(…)`; use `try/finally`
   with `await ava.dispose()`. Set `maxBytesBilled` before any billable query so
   a dry run can reject an over-budget statement.

No live GCP result is bundled with this documentation. The mock adapter and
SDK request mocks do not authenticate against or validate a real dataset.

## Support scope

- **Read-only.** Only single read-only `SELECT` statements (or `WITH`) pass
  validation; multi-statement, DDL/DML, `EXPORT DATA`, and scripting are
  rejected locally, and the production connector runs every statement through
  a query job created with `useLegacySql: false`. That flag only selects the
  GoogleSQL dialect — it is not read-proof by itself; real safety comes from
  the local validation plus a service account limited to reader roles.
- **Per-job billing budget.** When `maxBytesBilled` is configured, the
  connector first runs a dry run and rejects the query up front if its estimated
  bytes exceed the budget; each real query job is also created with
  `maximumBytesBilled` so the server-side guard holds during execution. This is
  a BigQuery processing/billing guard, not a result-size limit.
- **Schema discovery** reads `dataset.INFORMATION_SCHEMA.TABLES`,
  `.COLUMNS`, and `.KEY_COLUMN_USAGE` (only `BASE TABLE` rows; views and
  materialized views are out of scope, and cross-dataset relationships are
  not discovered). BigQuery's INFORMATION_SCHEMA columns are lower-cased
  (`table_name`, `column_name`, `data_type`, `is_nullable`).
- **Value fidelity.** The production connector decodes driver output
  losslessly: `INT64` keeps exact digits as a string (`9007199254740993` is
  never degraded to `9007199254740992`); `DATE` → `2023-01-02`; `DATETIME` →
  `2023-01-02 10:00:00`; `TIME` → `10:00:00`; `TIMESTAMP` → ISO 8601 UTC
  (`2023-01-02T10:00:00.000Z`); `NUMERIC`/`BIGNUMERIC` → exact decimal string;
  `BYTES` → base64; `BOOLEAN`/`FLOAT64` keep native JS values;
  `STRUCT`/`ARRAY` are normalized recursively, while `JSON` stays a string.
  Column names and types come from successful `jobs.getQueryResults` responses,
  including empty results. Ordinary job metadata is not a schema fallback; a
  successful response without a schema fails explicitly.
- **Paged reads and output caps.** Public queries are bounded by `maxRows`
  (default 200 total rows) and `maxResultBytes` (default 1 MiB of serialized,
  decoded output rows). The connector manually follows page tokens in server
  order until either budget stops the read; page tokens and `totalRows` preserve
  truncation information. The original SQL is not wrapped in an outer `LIMIT`,
  so top-level ordering is preserved. `defaultRowLimit` only sets each request's
  `maxResults` page size (the remaining row budget can reduce it); it is not a
  total row limit. The SDK's automatic pagination is disabled in favor of this
  explicit loop.
- **Byte-limit boundary.** `maxResultBytes` is applied after the SDK has read a
  page and AVA has decoded each row. It is not a wire-response cap and does not
  limit BigQuery bytes processed. A page already returned by the SDK can contain
  rows beyond the output budget; AVA decodes and measures the first row that
  crosses the boundary, omits it, and does not request another page. Schema
  discovery and profiling queries do not inherit public output budgets: they
  exhaust every page or fail explicitly (for example, on a page error or the
  per-query timeout). The
  per-query `timeoutMs` (default 60000) covers polling and all pages, and
  requests cancellation of the running BigQuery job.
- **Profiling limits.** Metrics compile to one aggregate GoogleSQL query per
  table. `duplicate_count`-style metrics are generated only for columns whose
  type supports them (`numeric`, `string`, `boolean`, `date`); `JSON`,
  `ARRAY`, `STRUCT` and other unrecognized types only receive type-agnostic
  metrics such as `null_count`. BigQuery has no enforced primary keys, so
  keys from `.KEY_COLUMN_USAGE` are observations, not guarantees.
- **Resource release.** Call `engine.dispose()` / `ava.dispose()` to `close()`
  the connector; closing also requests cancellation of in-flight jobs. Engine
  `dispose` is idempotent and tolerates close errors.

## Adapters

### `'@google-cloud/bigquery'` (default)

Production connector through the official [`@google-cloud/bigquery`][driver]
client (≥ `9.6.0`), declared as an `optionalDependencies` entry and loaded with
a deferred dynamic import — the module is still usable without it (install it
when you want real connections):

```bash
npm install @google-cloud/bigquery@^9.6.0
```

The connector is compiled against the SDK's published type declarations: job
construction uses `Query`/`Job`, result reading goes through manual
`Job#getQueryResults` calls (`maxResults`, `wrapIntegers`,
`autoPaginate: false`), and `dryRun` estimates `totalBytesProcessed` before any
billable job starts.

### `'mock'`

An in-memory connector requiring no GCP project or network. Seed it with
`options.tables`:

```typescript
import { BIGQUERY_TABLE_SEED } from '@antv/ava';

await ava.source({
  type: 'bigquery',
  options: {
    adapter: 'mock',
    projectId: 'demo-project',
    dataset: 'demo',
    tables: BIGQUERY_TABLE_SEED,
  },
});
```

The mock serves dataset-scoped `INFORMATION_SCHEMA` views built from the
seeded tables and runs a minimal read-only GoogleSQL subset. Use it for demos,
CI, and tests.

## Natural-language examples (mock)

```typescript
// 1) Aggregate by region — the LLM emits a read-only GoogleSQL GROUP BY.
const result1 = await ava.analyze('Average revenue per order by region, sorted highest first');
// => bound rows, e.g. [{ region: 'South', avg_revenue: 82.25 }, ...]

// 2) Filter + aggregate.
const result2 = await ava.analyze('Which product sells the most units in the North region?');
```

## Tests

`__tests__/remote/bigquery.test.ts` covers the mock adapter end-to-end (schema
discovery, profile, read-only validation, bounded execution, error handling and
`dispose`). Public `ava.query()`/`ava.schema()` and the production connector are
tested by stubbing the `@google-cloud/bigquery` request/response surface:
native and empty-result schemas, ordered multi-page reads, row/byte truncation,
complete `INFORMATION_SCHEMA` pagination, later-page failure, dry-run budget
rejection, lossless value decoding, malformed credentials, and timeout
cancellation. These are SDK contract tests, not live GCP validation. Run with
vitest:

```bash
npm test -- __tests__/remote/bigquery.test.ts
```

## AI usage report

Refs #1013; updated 2026-11-13. AI assistants helped inspect AVA's engine and
CLI integration, the cached maintainer review, and the installed official SDK
response types, and assisted with implementation, regression tests, and
documentation. The delivery follows the repository's existing remote-engine
patterns and includes no GCP credentials or private dataset content.

Correctness claims are based on exact assertions over independently constructed
SDK response stubs, TypeScript, ESLint, and Vitest rather than AI self-review.
Maintainers should still review IAM, GoogleSQL coverage, pagination, and budget
boundaries. No live GCP authentication, query execution, or natural-language
versus direct-SQL comparison has been performed; mock and SDK-stub results are
not presented as live validation.

[bigquery]: https://cloud.google.com/bigquery
[driver]: https://github.com/googleapis/nodejs-bigquery
[docs]: https://ava.antv.antgroup.com/documentation/data/sources#bigquery
