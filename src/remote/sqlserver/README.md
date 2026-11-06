# AVA SQL Server data source

A read-only, [Microsoft SQL Server][mssql] remote engine for AVA v4. It discovers
table structure through `INFORMATION_SCHEMA` catalog views and executes read-only
T-SQL `SELECT` statements — data is never materialized locally.

## Architecture

```
SqlServerSourceOptions
        │  adapter: 'tedious' (default) | 'mock'
        ▼
SqlServerEngine (src/remote/sqlserver/engine.ts)
        │  creates a QueryConnector, forwards schema/profile/execute
        ▼
QueryConnector  (connector.ts)  ── interface: connect / query / close
   ├── tedious.ts   production driver via `tedious` (runtime-required, read-only)
   └── mock.ts      in-memory connector + minimal read-only T-SQL interpreter
```

Files:

| File          | Responsibility |
| ------------- | -------------- |
| `engine.ts`   | `SqlServerEngine` — source → connector, schema/profile/execute, read-only validation, result row caps. |
| `schema.ts`   | `getSqlServerSchema` — flat `INFORMATION_SCHEMA.COLUMNS / TABLES / KEY_COLUMN_USAGE` discovery. |
| `profile.ts`  | Per-column metrics compiled into read-only T-SQL (compiled per table into one aggregate query). |
| `connector.ts`| `QueryConnector` interface shared by both adapters. |
| `tedious.ts`  | Production connector (running against a real server) using the lazy cross-format tedious loader. |
| `tds-config.ts`| Builds a tedious connection config from `SqlServerSourceOptions` (structurally typed; never statically imports `tedious`). |
| `mock.ts`     | In-memory connector + small read-only T-SQL subset (SELECT / TOP / WHERE / GROUP BY / HAVING / ORDER BY / aggregates). |
| `examples.ts` | `SQLSERVER_TABLE_SEED` sales seed used by docs and tests. |

The dialect is registered in `src/query/sqlserver.ts`, which also exports
`validateReadOnlySqlServer` (rejects multi-statement / non-SELECT input) and
`limitedTsqlQuery` (adds a bounded `TOP (N)` to the main `SELECT`, preserving leading
CTEs and final `ORDER BY`; unsupported set/OFFSET forms fail explicitly).

## Connection

```typescript
const ava = new AVA({ llm: { model: 'gpt-4o', apiKey: process.env.OPENAI_KEY } });
await ava.source({
  type: 'sqlserver',
  options: {
    server: 'sql.example.com',
    database: 'sales',
    user: 'reader',
    password: process.env.SQLSERVER_PASSWORD,
  },
});
```

Required: `server`, `database`. Optional: `port` (1433), `user`/`password`
(Integrated auth when omitted), `instanceName`, `encrypt`, `trustServerCertificate`,
`requestTimeout`, `connectTimeout`. See the [site docs][docs] for the full table.

## Support scope

- **Read-only.** Only single read-only `SELECT` statements pass validation;
  multi-statement, `EXEC`, DDL/DML are rejected locally, and the `tedious` adapter
  opens the connection with `ApplicationIntent=ReadOnly`. Deployments must also use a
  database principal granted only `SELECT`; `ApplicationIntent` does not revoke writes.
- **Schema discovery** reads `INFORMATION_SCHEMA.TABLES`, `.COLUMNS`, and
  `.KEY_COLUMN_USAGE` (primary keys mapped to `Schema.primaryKey`).
- **Result caps.** Query results/profiles are bounded by `maxRows` (default 200)
  and `maxResultBytes` (default 1 MiB). Row limiting adds `TOP (N)` to the main SELECT.
- **Resource release.** Call `engine.dispose()` / `ava.dispose()` to `close()` the
  connection; `dispose` is idempotent and tolerates close errors.

## Adapters

### `'tedious'` (default)

Production connector through the [`tedious`][tedious] TDS driver. `tedious` is
loaded through a lazy dynamic import so this module has **no** hard dependency on it —
install it when you want real connections:

```bash
npm install tedious
```

### `'mock'`

An in-memory connector requiring no server or network. Seed it with `options.tables`:

```typescript
await ava.source({
  type: 'sqlserver',
  options: {
    adapter: 'mock',
    database: 'demo',
    tables: SQLSERVER_TABLE_SEED, // import { SQLSERVER_TABLE_SEED } from '@antv/ava'
  },
});
```

The mock serves `INFORMATION_SCHEMA` catalog views built from the seeded tables and
runs a minimal read-only T-SQL subset. Use it for demos, CI, and tests.

## Natural-language examples (mock)

```typescript
// 1) Aggregate by region — the LLM emits a read-only T-SQL GROUP BY.
const result1 = await ava.analyze('Average revenue per order by region, sorted highest first');
// => bound rows, e.g. [{ Region: 'South', avg_revenue: 82.25 }, ...]

// 2) Filter + aggregate.
const result2 = await ava.analyze('Which product sells the most units in the North region?');
```

## Tests

`__tests__/remote/sqlserver.test.ts` covers the mock adapter end-to-end (schema
discovery, profile, read-only validation, bounded execution, error handling and
`dispose`), plus the read-only/limiting helpers. Run with vitest:

```bash
npm test -- __tests__/remote/sqlserver.test.ts
```

[mssql]: https://www.microsoft.com/en-us/sql-server
[tedious]: https://github.com/tediousjs/tedious
[docs]: https://ava.antv.antgroup.com/documentation/data/sources#sql-server