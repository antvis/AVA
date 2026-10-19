# Data Sources

## Choose an Engine

| Data source | Engine | Query language |
| --- | --- | --- |
| CSV/JSON/Parquet/Excel files, inline CSV/JSON | DuckDB by default; Python is optional | DuckDB SQL / Python (pandas) |
| MySQL, PostgreSQL, SQLite, MongoDB | DuckDB by default | DuckDB SQL |
| ClickHouse | ClickHouse is selected automatically | ClickHouse SQL |
| Supabase | Supabase is selected automatically | PostgreSQL SQL |
| Feishu Bitable | DuckDB only | DuckDB SQL |
| Inline CSV/JSON/text | JavaScript is optional when explicitly selected | JavaScript |

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

A regular `.json` file is read as data rows. Only `@file` or stdin `-` reads JSON as configuration; configuration input cannot be combined with `--type`. Relative paths are resolved from the command's working directory. Read options may vary by engine.

For other common configurations, set `type` and `options` as shown:

| Use case | `type` | Example `options` |
| --- | --- | --- |
| JSON rows | `json` | `{"data":[{"region":"East","sales":10}]}` |
| Inline CSV | `csv` | `{"csv":"region,sales\nEast,10"}` |
| Authenticated URL | `json-file` | `{"path":"https://example.com/data.json","headers":{"Authorization":"******"}}` |

For unstructured text, you can first extract JSON rows containing only information supported by the source text. The native `text` source calls an internal AVA model and requires additional model configuration.

## Databases

Use the configuration format and load command shown above:

| `type` | Example `options` |
| --- | --- |
| `mysql` | `{"host":"localhost","database":"sales","user":"reader","password":"REPLACE"}` |
| `postgresql` | `{"host":"localhost","database":"sales","user":"reader","password":"REPLACE","schema":"public"}` |
| `mongodb` | `{"connection":"mongodb://localhost:27017","database":"sales"}` |
| `clickhouse` | `{"url":"http://localhost:8123","database":"sales","username":"reader","password":"REPLACE"}` |
| `supabase` | `{"accessToken":"REPLACE","projectRef":"REPLACE"}` |

Use authorized read-only credentials. Restrict temporary credential files to the current user and delete them after loading. Do not put credentials in deliverables or logs.

- MySQL, PostgreSQL, SQLite, and MongoDB require the corresponding DuckDB extensions. MongoDB uses the `mongo` community extension. Each collection becomes a table, and its schema is inferred from samples, so rare fields may be missed.
- ClickHouse connects over HTTP(S) and requires version 23.10 or later.
- Supabase uses the Management API; `accessToken` must be a token authorized for that API.

## Feishu Bitable

`feishu-bitable` is read-only. Pass it in an `@file` or stdin config. It is not
inferred from a file extension, and `--type` cannot supply it. The session engine is DuckDB.
Python and Javascript cannot load this source. The loaded rows are one view named `data`.

`appId` and `appSecret` are required. They are the internal app credentials used to request a tenant access token. Provide `url`, or both `appToken` and `tableId`. When both the URL and those ids are set, they must name the same table.

```json
{
    "type":"feishu-bitable",
    "options":{
      "url":"https://my.feishu.cn/base/AXuDbVoV7aKqzpslXwscP41Wncc?
      table=tblehsChh5T3X69i&view=vewfxHhZEb",
      "appId":"cli_a91d00b31ff81cee",
      "appSecret":"h32fMrkYRT0scbfIeeNTjfNSYgnyqRd1"
      }
}
```

```sh
ava source @feishu.json > session.json
```

The path segment after `base` is `appToken`. The `table` query parameter is `tableId`.
The `view` parameter is ignored; the whole table is loaded, not one view. Do not put `appSecret` in deliverables or logs.

Supported filed types become columns. Other types are omitted.

| type | Field | Cell value | 
| --- | --- | --- |
|1| Text | string,or null when empty |
|2| Number | number, or null when empty |
|3| Single select | option name, or null |
|4| Multi select | array of option names, or null |
|5| Date | ISO string, or null |
|7| Checkbox | boolean|
|13| Phone | string, or null|
|15| URL | link text, or the URL, or null
|1001| Created time | ISO string |
|1002| Last modified time | ISO string |
|1005| Auto number | string,or null|

People, attachments, links to other records, locations, groups, created-by,
modified-by, formulas, and lookups are skipped.