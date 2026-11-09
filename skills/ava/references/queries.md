# Queries and Results

## Profile

```sh
ava profile "$DATASET_ID" --metrics row_count,null_count,min,max,mean > profile.json
```

Each call recomputes statistics. `--metrics` replaces the defaults across all tables; it cannot select a table or column. Prefer targeted SQL on large remote sources.

## Run a Query

Use `ava schema`'s `models`, `tableReference`, and `columns` for identifiers; follow `language` and dialect `instructions`. If a session uses another language, reload with the source's default SQL engine when authorized access is available.

Run one read-only `SELECT` (CTEs allowed) from a `.sql` file:

```sh
ava query "$DATASET_ID" --dsl @query.sql > result.json
```

For ClickHouse, omit `FORMAT`, `SETTINGS`, and `INTO OUTFILE`. For Snowflake, double-quote identifiers exactly as schema lists them; `SYSTEM$` functions, procedures, and dynamic calls via `IDENTIFIER(name)(...)` are rejected. These restrictions also apply when schema omits dialect instructions.

## Results and Limits

Results contain `data` rows and their column `schema`. `truncated: true` means incomplete output; `truncatedBy` gives the reason. `rowCount` counts result rows, not source records, and is omitted when truncated.

The default response limit is 200 rows or 1 MiB; individual fields remain capped at 1 MiB. See `ava query --help` for limit flags. Aggregate in SQL before these response limits; sampled, limited, or truncated detail rows cannot support full-data statistics. An untruncated result alone does not prove full source coverage.
