# Data Sources

## Load a Source

Load a path/URL directly, or save a source configuration as `source.json`:

```sh
ava source /data/sales.csv > session.json
ava source @source.json > session.json
```

Only `@file` or stdin `-` reads configuration; a plain `.json` path loads data. Do not combine configurations with `--type`. Relative paths resolve from the working directory.

## Files and Inline Rows

Extensions select the source type automatically; use `--type` when the extension is unrecognized:

| Extension | Type | Notes |
| --- | --- | --- |
| `.csv` | `csv-file` | Reader flags go in `options.options` |
| `.json` | `json-file` | Reader flags go in `options.options` |
| `.parquet` | `parquet` | No nested reader options |
| `.xlsx` | `excel` | All sheets load unless `sheets` selects them |
| `.sqlite`, `.sqlite3`, `.db` | `sqlite` | Local files only |

File configurations use `options.path`. Except SQLite, they also accept HTTP(S) URLs and `options.headers` for authentication.

CSV with a semicolon delimiter and text-preserving columns:

```json
{
  "type": "csv-file",
  "options": {
    "path": "/data/sales.csv",
    "options": { "delim": ";", "all_varchar": true }
  }
}
```

Inline rows use `json` with `options.data`. For unstructured text, extract supported facts into rows first:

```json
{ "type": "json", "options": { "data": [{ "region": "East", "sales": 10 }] } }
```

To select an Excel sheet and inclusive A1 range (`header` defaults to `true`):

```json
{
  "type": "excel",
  "options": {
    "path": "/data/sales.xlsx",
    "sheets": [{ "sheet": "Orders", "range": "B3:F100" }]
  }
}
```

## Databases

Use `@file` or stdin with authorized read-only credentials. Restrict temporary credential files to the current user and delete them after loading; exclude credentials from deliverables and logs.

Configurations have the form `{ "type": "…", "options": {…} }`:

| Type | Connection options | Notes |
| --- | --- | --- |
| `mysql` | `host`, `database`, `user`, `password` | Supports `port` and [SSH](#ssh-tunnels) |
| `postgresql` | `host`, `database`, `user`, `password`, `schema` (default `public`) | Supports `port` and [SSH](#ssh-tunnels) |
| `mongodb` | `connection`, `database` | Keep database consistent with the URI; each collection becomes a table; sampled schema may miss rare fields |
| `clickhouse` | `url`, `database`, `username`, `password` | HTTP(S), version ≥23.10 |
| `sqlserver` | `host`, `database`, `user`, `password` | SQL authentication, verified TLS; grant `SELECT` and `VIEW DEFINITION` |
| `supabase` | `accessToken`, `projectRef` | Management API token, not an anon/service-role key |

### Snowflake

```json
{
  "type": "snowflake",
  "options": {
    "account": "myorg-myaccount",
    "username": "READER",
    "authenticator": "SNOWFLAKE_JWT",
    "privateKeyPath": "/secure/rsa_key.p8",
    "warehouse": "AVA_WH",
    "role": "READER_ROLE",
    "database": "SALES",
    "schema": "PUBLIC"
  }
}
```

Queries consume warehouse credits. One source covers one schema (default `PUBLIC`) and role-visible objects. Other snowflake-sdk connection options pass through.

### SSH Tunnels

For MySQL/PostgreSQL behind a bastion, use the database address reachable from it. Add `ssh` inside `options`; obtain its SHA-256 host fingerprint over a trusted channel and omit base64 padding:

```json
{
  "ssh": {
    "host": "bastion.example.com",
    "user": "ssh-user",
    "password": "REPLACE",
    "hostKeyFingerprint": "SHA256:REPLACE_WITH_SERVER_FINGERPRINT"
  }
}
```

## Feishu Bitable

Links on `feishu.cn` and `larksuite.com` load the whole table read-only as `data`, ignoring the URL's `view` filter:

```sh
ava source "https://<tenant>.feishu.cn/base/<app_token>?table=<table_id>" > session.json
ava source "https://<tenant>.feishu.cn/wiki/<node_token>?table=<table_id>" > session.json
```

Without `?table=`, a single table is selected automatically; multiple tables are listed for selection. Wiki URLs must host Bitable, not Docx or Sheets; they require `wiki:wiki:readonly` and wiki-space membership. Keep the wiki URL: its node token is not an `appToken`.

### Credentials

The internal app needs table collaborator access and `bitable:app:readonly`; advanced permissions require manage rights. Credentials resolve from configuration, then `AVA_FEISHU_APP_ID`/`AVA_FEISHU_APP_SECRET`, then `~/.ava/feishu.json`. Terminals can bind and save them.

Alternatively load an `@file`/stdin configuration (`--type` cannot supply this source):

```json
{
  "type": "feishu-bitable",
  "options": {
    "url": "https://<tenant>.feishu.cn/base/<app_token>?table=<table_id>",
    "appId": "<app-id>",
    "appSecret": "<app-secret>"
  }
}
```

Instead of `url`, a base table accepts `appToken` and `tableId`. When both forms are present they must agree. Keep `appSecret` out of commits and deliverables.

### Cell Values

Complex cells flatten to text, lists join with commas, and dates use ISO strings. People/chats use names, attachments use filenames, and record links use IDs. Unsupported fields are omitted; unsupported formula/lookup results become null.

## Tencent Docs SmartSheet

Use a native OpenAPI fileID and explicit sheetID (not a sharing URL or encoded ID):

```json
{
  "type": "tencent-smartsheet",
  "options": { "fileId": "<native-openapi-file-id>", "sheetId": "<sheet-id>", "clientId": "<client-id>", "openId": "<open-id>", "accessToken": "<access-token>" }
}
```

Supply required `options.clientId`, `options.openId`, `options.accessToken` from your application's authorized OAuth flow, then run `ava source @tencent-docs.json` using a local, untracked configuration file. The loader does not read environment variables; applications resolve their own configuration before passing options. MCP `options.token` is rejected; `TENCENT_DOCS_TOKEN` is not used. No Client Secret, OAuth callback or refresh service in the loader. For encoded IDs use the separate controlled conversion described in the repository example; AVA does not scan private files or convert IDs silently.

This is a read-only single-table snapshot using native `fetch`, `getFields` and `getRecords`, no MCP SDK. It exposes DuckDB `data` with source titles and `_record_id`. Supported numeric types: text 1, number 2, checkbox 3, date/time 4, created/modified time 12/13, progress 14, phone/email 15/16, single-select 17 (not 9), currency 26, percentage 28. Restored scalars follow official FieldType/Value contracts and have native HTTP → formal loader → real DuckDB offline tests. All six restored types now also have real-API/formal-loader verification on Windows/Linux using an explicitly approved synthetic fixture. Real v2 responses omit system-time cells from values: for native 12/13 only, use record createTime/updateTime millisecond metadata when the cell is omitted; preserve explicit values/nulls and never infer from an ordinary date/title. Exact system times are compared with independently read source metadata, not merely checked through the old four-type business aggregates. Currency 26 and percentage 28 are independently confirmed by official service metadata and native OpenAPI/formal-loader round trips, not inferred from type-2 numeric fields. Both use raw DOUBLE values without formatting or scaling. OAuth and native-ID configuration still changes; do not call the migration completely lossless. Rich text is concatenated; raw numeric/progress values are not percentage-scaled; false/zero/leading-zero/empty strings are preserved; timestamps use UTC. Null/omitted cells, empty rows/tables and explicit SQL types are retained. Complex types are omitted; duplicate/reserved columns and invalid values fail the load. See examples/tencent-docs/README.md for contracts, evidence and the sales example; core regressions are kept in the existing conversion/client suites.

Options: `pageSize` 1–100 (default 100 for fields/records), `maxRecords` 1–100,000 (default 10,000), `timeoutMs` 1–110,000 (whole load, default 60,000), `maxRetries` 0–5 (default 2). Responses/paginated reads are capped at 16 MiB and 1,000 fields. Expanded snapshots also have 16 MiB UTF-8 JSON and 1,000,000-cell budgets including nulls/names/record IDs; wide tables have a lower row cap. Pages are converted incrementally. A parameterized JSON array and explicit schema create the table directly, without temporary files or a directory whitelist for analysis.

HTTP status and business `ret` are both checked. Retry only network errors and HTTP 429/500/502/503/504, with valid `Retry-After` up to 30 seconds and the overall deadline. No business error-code retries or MCP quota assumptions. Preserve upstream ret/msg, HTTP status, request IDs and selected network error name/message/code plus one cause level. Do not copy arbitrary response/error objects, stacks or headers. Exact configured credentials are replaced only in selected diagnostic strings; fields over 8 KiB are omitted whole. Non-JSON or incomplete HTTP error bodies are omitted while status/request ID remain available. Redirects are refused.

Incomplete paging, repeated IDs, changed totals/supported metadata and resource overflow fail without partial data. Stop edits during import: it is not a transactionally consistent or continuously synchronized snapshot. Multi-table, discovery, views, field-selection and writes are outside this migration. Model calls are not needed for loading/schema/SQL. See `examples/tencent-docs/README.md` for OAuth/native-ID setup, manually entered synthetic fixtures, two real natural-language sales examples and opt-in live validation.

## GitHub

Load GitHub issues and pull requests with the DuckDB engine. See the [GitHub source documentation](https://ava.antv.vision/documentation/data/sources/#github) for the data you can read.
