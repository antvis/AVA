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

## GitHub

Pass a GitHub repository URL to `ava source` to load its issues and pull requests. Include other inputs in the same command to analyze them together, for example `ava source https://github.com/OWNER/REPO labels.csv`. See the [GitHub source documentation](https://ava.antv.vision/documentation/data/sources/#github) for fields and connection options.
