# AVA Snowflake data source

A read-only [Snowflake][snowflake] remote engine for AVA v4. It discovers table
structure through the `INFORMATION_SCHEMA` catalog views and executes read-only
Snowflake SQL `SELECT` statements — data is never materialized locally.

## Architecture

```
SnowflakeSourceOptions
        │  adapter: 'snowflake' (default) | 'mock'
        ▼
SnowflakeEngine (src/remote/snowflake/engine.ts)
        │  creates a QueryConnector, forwards schema/profile/execute
        ▼
QueryConnector  (connector.ts)  ── interface: connect / query / close
   ├── snowflake.ts   production driver via `snowflake-sdk` (runtime-required, read-only)
   └── mock.ts        in-memory connector + minimal read-only SQL interpreter
```

Files:

| File                | Responsibility |
| ------------------- | -------------- |
| `engine.ts`         | `SnowflakeEngine` — source → connector, schema/profile/execute, read-only validation, result row caps. |
| `schema.ts`         | `getSnowflakeSchema` — `INFORMATION_SCHEMA.COLUMNS / TABLES` and `SHOW PRIMARY KEYS` discovery. |
| `profile.ts`        | Per-column metrics compiled into read-only SQL (compiled per table into one aggregate query). |
| `connector.ts`      | `QueryConnector` interface shared by both adapters. |
| `snowflake.ts`      | Production connector (running against a real account) using an ESM/CommonJS-compatible lazy SDK loader. |
| `snowflake-config.ts` | Builds a driver connection config from `SnowflakeSourceOptions` (structurally typed; never statically imports the driver). |
| `mock.ts`           | In-memory connector + small read-only SQL subset (SELECT / LIMIT / WHERE / GROUP BY / HAVING / ORDER BY / aggregates). |
| `examples.ts`       | `SNOWFLAKE_TABLE_SEED` sales seed used by docs and tests. |

The dialect is registered in `src/query/snowflake.ts`, which also exports
`validateReadOnlySnowflake` (rejects multi-statement / non-SELECT input) and
`limitedSnowflakeQuery` (wraps a query with `SELECT * FROM (…) AS __ava_query LIMIT N`).

## Connection

```typescript
const ava = new AVA({ llm: { model: 'gpt-4o', apiKey: proces..._KEY } });
await ava.source({
  type: 'snowflake',
  options: {
    account: 'xy12345.us-east-1',
    database: 'analytics',
    schema: 'public',
    username: 'reader',
    password: process.env.SNOWFLAKE_PASSWORD,
  },
});
```

The production adapter requires `account`, `username`, and `database`; the mock
requires only `database` and its seeds. Optional: `schema` (default `PUBLIC`),
`warehouse`, `role`, `region`, `host`, `connectionTimeout`, `authenticator`,
`token` (OAuth), and `privateKey` (selects key-pair JWT auth). See the
[site docs][docs] for the full table.

## Support scope

- **Read-only.** Only single read-only `SELECT`/`WITH` statements pass
  validation; multi-statement, `CALL`, DDL/DML, stages, unloads, sequence
  advances, and other side effects are rejected locally. Always use a
  restricted read-only role in production: selecting a database/schema is not
  a privilege boundary, and local validation is defense-in-depth.
- **Schema discovery** reads `INFORMATION_SCHEMA.TABLES` and `.COLUMNS`, plus
  `SHOW PRIMARY KEYS` (primary keys mapped to `Schema.primaryKey`).
- **Result caps.** Query results/profiles are bounded by `maxRows` (default
  200) and `maxResultBytes` (default 1 MiB). Row limiting uses
  `SELECT * FROM (…) AS __ava_query LIMIT N`.
- **Resource release.** Call `engine.dispose()` / `ava.dispose()` to `close()`
  the connection; `dispose` is idempotent and tolerates close errors.

## Adapters

### `'snowflake'` (default)

Production connector through the [`snowflake-sdk`][sdk] driver. `snowflake-sdk`
is loaded lazily in both ESM and CommonJS builds so this module has **no** hard
dependency on it — install it when you want real connections:

```bash
npm install snowflake-sdk
```

### `'mock'`

An in-memory connector requiring no account or network. Seed it with `options.tables`:

```typescript
await ava.source({
  type: 'snowflake',
  options: {
    adapter: 'mock',
    database: 'demo',
    tables: SNOWFLAKE_TABLE_SEED, // from '@antv/ava/remote'
  },
});
```

The mock serves `INFORMATION_SCHEMA` catalog views and `SHOW PRIMARY KEYS` from
the seeded tables and runs a small read-only SQL subset. Use it for demos, CI,
and tests.

## Natural-language examples (mock)

```typescript
// 1) Aggregate by region — the LLM emits a read-only Snowflake GROUP BY.
const result1 = await ava.analyze('Average revenue per order by region, sorted highest first');
// => bound rows, e.g. [{ REGION: 'South', AVG_REVENUE: 82.25 }, ...]

// 2) Filter + aggregate.
const result2 = await ava.analyze('Which product sells the most units in the North region?');
```

## Tests

`__tests__/remote/snowflake.test.ts` covers the mock adapter end-to-end (schema
discovery, profile, read-only validation, bounded execution, error handling and
`dispose`), plus the read-only/limiting helpers. Run with vitest:

```bash
npm test -- __tests__/remote/snowflake.test.ts
```

[snowflake]: https://www.snowflake.com
[sdk]: https://www.npmjs.com/package/snowflake-sdk
[docs]: https://ava.antv.antgroup.com/documentation/data/sources#snowflake