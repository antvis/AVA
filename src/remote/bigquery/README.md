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
`validateReadOnlyBigQuery` (rejects multi-statement / non-SELECT input) and
`limitedBigQuerySql` (wraps a query with `SELECT * FROM (…) LIMIT N`).

Name→table mapping follows BigQuery's hierarchy exactly: `Model` /
`tableReference` is `catalog` = project id, `schema` = dataset id, `table` =
table name (the dataset-scoped `INFORMATION_SCHEMA` catalog column).

## Connection

```typescript
const ava = new AVA({ llm: { model: 'gpt-4o', apiKey: *** } });
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
`profile()`), `credentials` (service-account JSON object), `clientEmail` +
`privateKey`, `location`, `maxBytesBilled` (dry-run-checked + server-side
`maximumBytesBilled`), `timeoutMs`, `defaultRowLimit` (bounds the
`getQueryResults` read), `adapter`, `tables`.
When no credentials are passed, the client uses application-default
credentials (ADC). See the [site docs][docs] for the full table.

## Support scope

- **Read-only.** Only single read-only `SELECT` statements (or `WITH`) pass
  validation; multi-statement, DDL/DML, `EXPORT DATA`, and scripting are
  rejected locally, and the production connector runs every statement through
  a query job created with `useLegacySql: false`. That flag only selects the
  GoogleSQL dialect — it is not read-proof by itself; real safety comes from
  the local validation plus a service account limited to reader roles.
- **Budget.** When `maxBytesBilled` is configured, the connector first runs a
  dry run and rejects the query up front if its estimated bytes exceed the
  budget; the job itself is also created with `maximumBytesBilled` so the
  server-side guard holds during execution.
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
  Column names and types come from the driver schema — including for empty
  results, whose schema falls back to the job metadata.
- **Result caps.** Query results/profiles are bounded by `maxRows` (default
  200) and `maxResultBytes` (default 1 MiB). Row limiting wraps the statement
  server-side with `SELECT * FROM (…) LIMIT N` and the production connector
  additionally bounds the read itself: `Job#getQueryResults` is called with
  `maxResults` (from `defaultRowLimit`) and `autoPaginate: false`, so only the
  first page is fetched — the full result is never pulled just to be
  truncated locally. The per-query `timeoutMs` (default 60000) cancels the
  running BigQuery job.
- **Profiling limits.** Metrics compile to one aggregate GoogleSQL query per
  table. `duplicate_count`-style metrics are generated only for columns whose
  type supports them (`numeric`, `string`, `boolean`, `date`); `JSON`,
  `ARRAY`, `STRUCT` and other unrecognized types only receive type-agnostic
  metrics such as `null_count`. BigQuery has no enforced primary keys, so
  keys from `.KEY_COLUMN_USAGE` are observations, not guarantees.
- **Resource release.** Call `engine.dispose()` / `ava.dispose()` to `close()` 
  the connection; `dispose` is idempotent and tolerates close errors.

## Adapters

### `'@google-cloud/bigquery'` (default)

Production connector through the official [`@google-cloud/bigquery`][driver]
client (≥ `9.6.0`), declared as an `optionalDependencies` entry and loaded with
a deferred dynamic import — the module is still usable without it (install it
when you want real connections):

```bash
npm install @google-cloud/bigquery
```

The connector is compiled against the SDK's published type declarations: job
construction uses `Query`/`Job`, result reading goes through
`Job#getQueryResults` (`maxResults`, `wrapIntegers`, `autoPaginate: false`),
and `dryRun` estimates `totalBytesProcessed` before any billable job starts.

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
`dispose`), plus the read-only/limiting helpers. The production connector is
tested by stubbing the `@google-cloud/bigquery` request/response surface —
job config vs `getQueryResults` bounds, dry-run budget rejection, lossless
value decoding, empty-result schema fallback and timeout cancellation — with
no live GCP project required either. Run with vitest:

```bash
npm test -- __tests__/remote/bigquery.test.ts
```

[bigquery]: https://cloud.google.com/bigquery
[driver]: https://github.com/googleapis/nodejs-bigquery
[docs]: https://ava.antv.antgroup.com/documentation/data/sources#bigquery