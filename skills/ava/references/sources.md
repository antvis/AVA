# Data Sources

## Choose an Engine

| Data source | Engine | Query language |
| --- | --- | --- |
| CSV/JSON/Parquet/Excel files | DuckDB by default; Python is optional | DuckDB SQL / Python (pandas) |
| Inline CSV/JSON | DuckDB by default; Python or JavaScript is optional | SQL / Python / JavaScript |
| Unstructured text | DuckDB by default; JavaScript is optional; requires a model | SQL / JavaScript |
| MySQL, PostgreSQL, SQLite, MongoDB | DuckDB only | DuckDB SQL |
| ClickHouse | ClickHouse only, selected automatically | ClickHouse SQL |
| SQL Server | SQL Server only, selected automatically | T-SQL |
| Supabase | Supabase only, selected automatically | PostgreSQL SQL |
| Feishu Bitable | DuckDB only | DuckDB SQL |
| GitHub issues and pull requests | DuckDB only | DuckDB SQL |

To use Python or JavaScript, add `--engine python` or `--engine javascript` to the `source` command. Python does not connect directly to databases. To post-process database results with pandas, query the database first, then export the complete result as described in [Results and Post-Processing](queries.md#results-and-post-processing).

## Files and Configuration

**Load a regular file or URL directly:**

```sh
ava source /data/sales.csv > session.json
```

The CLI identifies CSV, JSON, Parquet, XLSX, and SQLite (`.sqlite`, `.sqlite3`, `.db`) files by extension. If the extension is not recognized, use `--type` with `csv-file`, `json-file`, `parquet`, `excel`, or `sqlite`. SQLite supports local files only; other file sources support HTTP(S). Each Excel sheet becomes a table; use the schema to find its actual table name.

**Use configuration for inline data, authentication, or custom read options:**

Configuration includes `type` and `options`. `type` specifies the data format or database type, not the engine. For example, to read a semicolon-delimited CSV while preserving text types, save the following as `source.json`:

```json
{
  "type": "csv-file",
  "options": {
    "path": "/data/sales.csv",
    "options": { "delim": ";", "all_varchar": true }
  }
}
```

```sh
ava source @source.json > session.json
```

A regular `.json` file is read as data rows. Only `@file` or stdin `-` reads JSON as configuration; configuration input cannot be combined with `--type`. Relative paths are resolved from the command's working directory.

For other common configurations, set `type` and `options` as shown:

| Use case | `type` | Example `options` |
| --- | --- | --- |
| JSON rows | `json` | `{"data":[{"region":"East","sales":10}]}` |
| Inline CSV | `csv` | `{"csv":"region,sales\nEast,10"}` |
| Unstructured text | `text` | `{"text":"East region sales were 10."}` |
| Parquet file | `parquet` | `{"path":"/data/sales.parquet"}` |
| Excel workbook | `excel` | `{"path":"/data/sales.xlsx","sheets":[{"sheet":"Orders","range":"B3:F100","header":true}]}` |
| Authenticated URL | `json-file` | `{"path":"https://example.com/data.json","headers":{"Authorization":"******"}}` |

File sources except SQLite accept `headers` for HTTP(S) authentication. `csv-file` and `json-file` accept nested `options` for reader settings; `parquet` does not.

For Excel, omitting `sheets` loads every sheet. Otherwise use a nonempty array of unique sheet names, each with `sheet`, optional inclusive A1 `range`, and `header` (default `true`). DuckDB expects `.xlsx` and also accepts per-sheet booleans `all_varchar`, `ignore_errors`, `stop_at_empty`, and `empty_as_varchar`. Python supports `sheet`, `range`, and `header` only.

Python CSV reader options are limited to `header`, `names`, `delim`, `quote`, `escape`, `comment`, `skip`, `nullstr`, `all_varchar`, `decimal_separator`, `thousands`, `encoding`, and `compression`. Python JSON sources do not accept reader `options`. Do not assume DuckDB reader settings work in Python.

The native `text` source extracts rows using an AVA model and requires model credentials (see [Setup](setup.md)). Alternatively, extract JSON rows yourself, keeping only information supported by the source text, then load `json`.

## Databases

Use the configuration format and load command shown above:

| `type` | Example `options` |
| --- | --- |
| `mysql` | `{"host":"localhost","database":"sales","user":"reader","password":"REPLACE"}` |
| `postgresql` | `{"host":"localhost","database":"sales","user":"reader","password":"REPLACE","schema":"public"}` |
| `sqlite` | `{"path":"/data/sales.sqlite"}` |
| `mongodb` | `{"connection":"mongodb://localhost:27017","database":"sales"}` |
| `clickhouse` | `{"url":"http://localhost:8123","database":"sales","username":"reader","password":"REPLACE"}` |
| `sqlserver` | `{"host":"localhost","database":"sales","user":"reader","password":"REPLACE","schema":"dbo"}` |
| `supabase` | `{"accessToken":"REPLACE","projectRef":"REPLACE"}` |

Use authorized read-only credentials. Restrict temporary credential files to the current user and delete them after loading. Do not put credentials in deliverables or logs.

- MySQL, PostgreSQL, SQLite, and MongoDB require the corresponding DuckDB extensions. MongoDB uses the `mongo` community extension. Each collection becomes a table, and its schema is inferred from samples, so rare fields may be missed.
- MySQL/PostgreSQL accept `port` and `ssh: {"host":"bastion","user":"reader","port":22,"password":"REPLACE"}`. PostgreSQL defaults to schema `public`.
- MongoDB accepts `connection` or structured `host`, `port`, `user`, `password`, `authSource`, `srv`, `tls`, `ssl`, `tlsCAFile`, and `tlsAllowInvalidCertificates`; `database` is required in either form. `connection` takes precedence; keep its database consistent with `database`.
- ClickHouse connects over HTTP(S) and requires version 23.10 or later.
- ClickHouse requires `database` and either `host` or `url`. It accepts `port`, `user`/`username`, `password`, `access_token`, `pathname`, `application`, `session_id`, `role` (string or string array), `http_headers`, `request_timeout`, and other ClickHouse client options.
- SQL Server uses SQL authentication on port `1433` by default. Grant `SELECT` and `VIEW DEFINITION` permissions. TLS certificate verification is enabled by default.
- Supabase uses the Management API; `accessToken` must be a token authorized for that API.

## Feishu Bitable

`feishu-bitable` is read-only and uses DuckDB; the Python and JavaScript engines cannot load it. Rows are exposed as one view named `data`. The `view` parameter in the URL is ignored and the whole table is loaded, not one view.

The CLI detects Bitable links on `feishu.cn` and `larksuite.com` automatically (Node.js 22.13+), including tables that live inside a wiki:

```sh
ava source "https://<tenant>.feishu.cn/base/<app_token>?table=<table_id>" > session.json
ava source "https://<tenant>.feishu.cn/wiki/<node_token>?table=<table_id>" > session.json
```

A `/wiki/` URL carries a node token, so AVA calls the wiki `get_node` API and uses the hosted object's `obj_token` as the Bitable app token. The node must host a Bitable (`obj_type=bitable`); the app also needs `wiki:wiki:readonly` and membership of the wiki space, which is separate from the document grant on the table. Docx and Sheets nodes are rejected with an explicit error.

When `?table=` is missing, AVA uses the only table of the Bitable and, when there are several, stops with the table list so you can pick one. For non-URL configs, pass `feishu-bitable` through an `@file` or stdin config; `--type` cannot supply it.

`appId` and `appSecret` are required. They are the internal app credentials used to request a tenant access token, and the app must be added as a collaborator on the table. A `bitable:app:readonly` scope is enough unless the table enables advanced permissions, which require manage rights. Credentials are resolved from the source config first, then `AVA_FEISHU_APP_ID` / `AVA_FEISHU_APP_SECRET`, then `~/.ava/feishu.json`. In a terminal, AVA prompts for the pair, verifies it, and saves it to `~/.ava/feishu.json`.

The app must belong to an account allowed to call the Open Platform. Apps created by signing in to `open.feishu.cn` with a personal account such as a Doubao account are rejected with `Feishu Error 21001` (access denied due to platform policy) when requesting the tenant access token; create the app with a Feishu account bound to a phone number instead.


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

```sh
ava source @feishu.json > session.json
```

Provide `url`, or both `appToken` and `tableId`; when both are set they must name the same table. The path segment after `base` is `appToken`, and the `table` query parameter is `tableId`. For a `/wiki/` URL the segment after `wiki` is a node token that AVA resolves to the app token, so `appToken` alone is not enough to describe a wiki table. Never commit `appSecret` or put it in deliverables, logs, or screenshots; rotate it if it leaks.

Supported field types become columns. Other types are omitted. Complex cells are flattened to text; list values are joined with a comma.

| type | Field | Cell value |
| --- | --- | --- |
|1| Text | string, or null when empty |
|2| Number | number, or null when empty |
|3| Single select | option name, or null |
|4| Multi select | option names joined by comma, or null |
|5| Date | ISO string, or null |
|7| Checkbox | boolean |
|11| User | names joined by comma (name → en_name → email → id) |
|13| Phone | string, or null |
|15| URL | link text, or the URL, or null |
|17| Attachment | file names joined by comma |
|18| Single link | record IDs joined by comma |
|19| Lookup | converted from the wrapped result type |
|20| Formula | converted from the wrapped result type |
|21| Duplex link | record IDs joined by comma |
|22| Location | full address, falling back to name, address, or coordinates |
|23| Group chat | group names joined by comma |
|1001| Created time | ISO string |
|1002| Last modified time | ISO string |
|1003| Created user | names joined by comma |
|1004| Modified user | names joined by comma |
|1005| Auto number | string, or null |

Stage (24) and button (3001) fields are read-only and skipped. A formula or
lookup whose result type is unsupported becomes null.

## Tencent Docs SmartSheet

Use a native OpenAPI fileID and explicit sheetID (not a sharing URL or encoded ID):

```json
{
  "type": "tencent-smartsheet",
  "options": { "fileId": "<native-openapi-file-id>", "sheetId": "<sheet-id>", "clientId": "<client-id>", "openId": "<open-id>", "accessToken": "<access-token>" }
}
```

Supply required `options.clientId`, `options.openId`, `options.accessToken` from your application's authorized OAuth flow, then run `ava source @tencent-docs.json` using a local, untracked configuration file. The loader does not read environment variables; applications resolve their own configuration before passing options. MCP `options.token` is rejected; `TENCENT_DOCS_TOKEN` is not used. No Client Secret, OAuth callback or refresh service in the loader. For encoded IDs use the separate controlled conversion described in the repository example; AVA does not scan private files or convert IDs silently. Windows supports SDK usage; existing CLI sessions need Linux/macOS or WSL.

This is a read-only single-table snapshot using native `fetch`, `getFields` and `getRecords`, no MCP SDK. It exposes DuckDB `data` with source titles and `_record_id`. Supported numeric types: text 1, number 2, checkbox 3, date/time 4, created/modified time 12/13, progress 14, phone/email 15/16, single-select 17 (not 9), currency 26, percentage 28. Restored scalars follow official FieldType/Value contracts and have native HTTP → formal loader → real DuckDB offline tests. All six restored types now also have real-API/formal-loader verification on Windows/Linux using an explicitly approved synthetic fixture. Real v2 responses omit system-time cells from values: for native 12/13 only, use record createTime/updateTime millisecond metadata when the cell is omitted; preserve explicit values/nulls and never infer from an ordinary date/title. Exact system times are compared with independently read source metadata, not merely checked through the old four-type business aggregates. Currency 26 and percentage 28 are independently confirmed by official service metadata and native OpenAPI/formal-loader round trips, not inferred from type-2 numeric fields. Both use raw DOUBLE values without formatting or scaling. OAuth and native-ID configuration still changes; do not call the migration completely lossless. Rich text is concatenated; raw numeric/progress values are not percentage-scaled; false/zero/leading-zero/empty strings are preserved; timestamps use UTC. Null/omitted cells, empty rows/tables and explicit SQL types are retained. Complex types are omitted; duplicate/reserved columns and invalid values fail the load. See examples/tencent-docs/README.md for contracts, evidence and the sales example; core regressions are kept in the existing conversion/client suites.

Options: `pageSize` 1–100 (default 100 for fields/records), `maxRecords` 1–100,000 (default 10,000), `timeoutMs` 1–110,000 (whole load, default 60,000), `maxRetries` 0–5 (default 2). Responses/paginated reads are capped at 16 MiB and 1,000 fields. Expanded snapshots also have 16 MiB UTF-8 JSON and 1,000,000-cell budgets including nulls/names/record IDs; wide tables have a lower row cap. Pages are converted incrementally. A parameterized JSON array and explicit schema create the table directly, without temporary files or a directory whitelist for analysis.

HTTP status and business `ret` are both checked. Retry only network errors and HTTP 429/500/502/503/504, with valid `Retry-After` up to 30 seconds and the overall deadline. No business error-code retries or MCP quota assumptions. Preserve upstream ret/msg, HTTP status, request IDs and selected network error name/message/code plus one cause level. Do not copy arbitrary response/error objects, stacks or headers. Exact configured credentials are replaced only in selected diagnostic strings; fields over 8 KiB are omitted whole. Non-JSON or incomplete HTTP error bodies are omitted while status/request ID remain available. Redirects are refused.

Incomplete paging, repeated IDs, changed totals/supported metadata and resource overflow fail without partial data. Stop edits during import: it is not a transactionally consistent or continuously synchronized snapshot. Multi-table, discovery, views, field-selection and writes are outside this migration. Model calls are not needed for loading/schema/SQL. See `examples/tencent-docs/README.md` for OAuth/native-ID setup, manually entered synthetic fixtures, two real natural-language sales examples and opt-in live validation.

## GitHub

Load a repository's issues and pull requests to analyze issue backlog and pull request merge times. The CLI detects github.com repository links, including their `/issues` and `/pulls` pages; `owner/name` needs `--type github`:

```sh
ava source https://github.com/antvis/AVA > session.json
ava source antvis/AVA --type github > session.json
```

Public repositories load without a token, but unauthenticated requests share 60 per hour per IP address. The CLI reads `GH_TOKEN`, then `GITHUB_TOKEN`; a token allows 5,000 requests per hour and reads the private repositories it can access (fine-grained, read-only Issues and Pull requests). Never put tokens in deliverables or logs. Use a config for the other options:

```json
{
  "type": "github",
  "options": { "repository": "antvis/AVA", "since": "2026-01-01", "maxRecords": 10000, "timeoutMs": 60000 }
}
```

`since` (UTC without an offset) keeps every open item, so backlog counts stay complete, plus closed items updated since then; counts of items closed before it are incomplete. More than `maxRecords` (default 10,000, max 100,000) issues and pull requests fail the load instead of truncating it; `timeoutMs` (default 60,000, max 110,000) bounds the whole load, including retries and rate-limit waits. CLI loads must finish within two minutes.

Tables, both keyed by `number`:

| Table | Columns |
| --- | --- |
| `issues` | `title`, `state` (`open`/`closed`), `state_reason` (`completed`, `not_planned`, `duplicate`, `reopened`), `author`, `author_association`, `author_is_bot`, `assignees`, `labels`, `comments`, `created_at`, `updated_at`, `closed_at`, `html_url` |
| `pull_requests` | The same columns without `state_reason`, plus `is_draft`, `is_merged`, `merged_at` |

Query notes: a merged pull request has `state = 'closed'` and `is_merged`; closed without merging is `state = 'closed' AND NOT is_merged`. `state`, `state_reason` and `author_association` are ENUMs, so `ava schema` lists their values. Times are UTC `TIMESTAMP`s matching GitHub search qualifiers; compute durations with `date_diff('hour', created_at, merged_at)`. `assignees` and `labels` are `VARCHAR[]`: use `len(assignees) = 0`, `list_contains(labels, 'bug')` or `unnest(labels)`. Exclude bots with `NOT author_is_bot`. Bodies, reviews, commits and other repository objects are not loaded. See `examples/github/README.md` for the two business examples checked against GitHub search.
