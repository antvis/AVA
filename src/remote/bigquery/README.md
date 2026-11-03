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
| `schema.ts`           | `getBigQuerySchema` — flat `INFORMATION_SCHEMA` dataset views discovery. |
| `profile.ts`          | Per-column metrics compiled into read-only GoogleSQL (compiled per table into one aggregate query). |
| `connector.ts`        | `QueryConnector` interface shared by both adapters. |
| `bigquery-connector.ts` | Production connector (running against a real GCP project) using runtime `require('@google-cloud/bigquery')`. |
| `mock.ts`             | In-memory connector + small read-only GoogleSQL subset (SELECT / WHERE / GROUP BY / HAVING / ORDER BY / LIMIT / aggregates). |
| `examples.ts`         | `BIGQUERY_TABLE_SEED` sales seed used by docs and tests. |

The dialect is registered in `src/query/bigquery.ts`, which also exports
`validateReadOnlyBigQuery` (rejects multi-statement / non-SELECT input) and
`limitedBigQuerySql` (wraps a query with `SELECT * FROM (…) LIMIT N`).

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
`privateKey`, `location`, `maxBytesBilled`, `timeoutMs`, `adapter`, `tables`.
When no credentials are passed, the client uses application-default
credentials (ADC). See the [site docs][docs] for the full table.

## Support scope

- **Read-only.** Only single read-only `SELECT` statements (or `WITH`) pass
  validation; multi-statement, DDL/DML, `EXPORT DATA`, and scripting are
  rejected locally, and the production connector runs every statement through
  a query job created with `useLegacySql: false`.
- **Schema discovery** reads `dataset.INFORMATION_SCHEMA.TABLES`,
  `.COLUMNS`, and `.KEY_COLUMN_USAGE` (primary keys mapped to
  `Schema.primaryKey`). BigQuery's INFORMATION_SCHEMA columns are lower-cased
  (`table_name`, `column_name`, `data_type`, `is_nullable`).
- **Result caps.** Query results/profiles are bounded by `maxRows` (default
  200) and `maxResultBytes` (default 1 MiB). Row limiting uses
  `SELECT * FROM (…) LIMIT N`.
- **Resource release.** Call `engine.dispose()` / `ava.dispose()` to `close()`
  the connection; `dispose` is idempotent and tolerates close errors.

## Adapters

### `'@google-cloud/bigquery'` (default)

Production connector through the official [`@google-cloud/bigquery`][driver]
client. The package is loaded with a runtime `require` so this module has **no**
hard dependency on it — install it when you want real connections:

```bash
npm install @google-cloud/bigquery
```

### `'mock'`

An in-memory connector requiring no GCP project or network. Seed it with
`options.tables`:

```typescript
await ava.source({
  type: 'bigquery',
  options: {
    adapter: 'mock',
    projectId: 'demo-project',
    dataset: 'demo',
    tables: BIGQUERY_TABLE_SEED, // from '@antv/ava/remote'
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
`dispose`), plus the read-only/limiting helpers. Run with vitest:

```bash
npm test -- __tests__/remote/bigquery.test.ts
```

[bigquery]: https://cloud.google.com/bigquery
[driver]: https://github.com/googleapis/nodejs-bigquery
[docs]: https://ava.antv.antgroup.com/documentation/data/sources#bigquery