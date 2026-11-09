# Queries and Results

## Inspect as Needed

Use schema for structure, targeted queries for specific facts, and profile for broader statistics. For example:

```sh
ava profile "$DATASET_ID" --metrics row_count,null_count,min,max,mean > profile.json
```

Each profile call recomputes statistics. `--metrics` replaces the defaults and applies to eligible columns across all tables; it cannot filter by table or column. Prefer targeted queries on large remote sources.

## Run a Query

`ava schema` discovers structure on demand and caches it. Use its `models`, `tableReference`, and `columns` to identify the data. Confirm that the returned `language` identifies a SQL dialect (for example, `duckdb-sql`), and follow the optional top-level `instructions` for that dialect. For an existing non-SQL session, reload the source with a SQL engine if its configuration and authorized access are available; otherwise explain the blocker. Apply confirmed [business definitions](semantic.md) explicitly; `query` executes the supplied SQL without applying semantic filters or expressions for you. Save the query as UTF-8 and run it with `--dsl`:

```sh
ava query "$DATASET_ID" --dsl @query.sql > result.json
```

## SQL

Write a single read-only `SELECT` statement in the session's dialect. Read-only CTEs are allowed. Access only loaded tables and columns.

```sql
SELECT region, SUM(amount) AS total
FROM sales
GROUP BY region
ORDER BY total DESC, region;
```

For ClickHouse, do not add `FORMAT`, `SETTINGS`, or `INTO OUTFILE`; AVA handles execution.

For Snowflake, double-quote table and column names exactly as the schema lists them, because quoted identifiers are case-sensitive. `SYSTEM$` functions, procedures, and dynamic function calls via `IDENTIFIER(name)(...)` are rejected.

## Results and Limits

After a command succeeds, read the returned JSON:

- `data` contains the answer data for responding, charting, or reporting; `schema` describes the result columns.
- `truncated: true` means the result is incomplete; `truncatedBy` gives the reason. These fields may be omitted when the result is not truncated.
- `rowCount` is the number of rows in the current query result, not the source table. It is omitted when the result is truncated.

The default response limit is 200 rows or 1 MiB. Adjust it with `--max-rows` (up to 10000) and `--max-result-bytes`; individual fields are still limited to 1 MiB. These limits apply only to returned data. Perform aggregations and statistics in SQL; do not use truncated, limited, or sampled detail rows as a substitute for full-data statistics. An untruncated result does not necessarily mean the query covered all source data.
