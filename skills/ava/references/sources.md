# 数据源

## 引擎选择

| 数据来源 | 引擎 | 查询语言 |
| --- | --- | --- |
| CSV/JSON/Parquet/Excel 文件、内联 CSV/JSON | 默认 DuckDB；可选 Python | DuckDB SQL / Python（pandas） |
| MySQL、PostgreSQL、SQLite、MongoDB | 默认 DuckDB | DuckDB SQL |
| ClickHouse / Supabase | 自动选择对应远程引擎 | ClickHouse / PostgreSQL SQL |
| 内联 CSV/JSON/text | 用户指定时可选 JavaScript | JavaScript |

`type` 表示数据格式或数据库，`--engine` 单独选择引擎。Python 不直接连接数据库；需要 pandas 后处理时，先在数据库中筛选、聚合，再按[结果与后处理](queries.md#结果与后处理)导出完整结果。

## 文件与配置

`ava source <路径或URL>` 按扩展名识别 CSV、JSON、Parquet、XLSX、SQLite（`.sqlite`、`.sqlite3`、`.db`）；无法识别时用 `--type csv-file|json-file|parquet|excel|sqlite`。

普通 JSON 文件表示数据行；`@source.json` 或 stdin `-` 表示 `{ "type": "...", "options": { ... } }` 配置，不能同时传 `--type`。配置中的相对路径以命令工作目录为基准。

```sh
ava source @source.json --engine python > session.json
```

| 用途 | 配置示例 |
| --- | --- |
| JSON 行 | `{"type":"json","options":{"data":[{"region":"East","sales":10}]}}` |
| 内联 CSV | `{"type":"csv","options":{"csv":"region,sales\nEast,10"}}` |
| 文件 | `{"type":"csv-file","options":{"path":"/data/sales.csv"}}`；type 也可为 `json-file`、`parquet`、`excel`、`sqlite` |
| 认证 URL | `{"type":"json-file","options":{"path":"https://example.com/data.json","headers":{"Authorization":"Bearer REPLACE"}}}` |
| CSV 读取选项 | `{"type":"csv-file","options":{"path":"/data/sales.csv","options":{"delim":";","all_varchar":true}}}` |

SQLite 仅支持本地文件，其余文件源支持 HTTP(S)。Excel 每个 sheet 为一张表，名称以 schema 为准。不同引擎的读取选项可能不同；加载后核实前导零、日期和空值是否正确保留。

非结构化文本可由 Agent 提取成 JSON 行，仅记录原文支持的值并保留不确定性。原生 `text` 来源会调用 AVA 内部模型，需要额外模型配置。

## 数据库

将以下配置写入 `source.json`，通过 `ava source @source.json > session.json` 加载：

| 来源 | 最小配置示例 |
| --- | --- |
| MySQL | `{"type":"mysql","options":{"host":"localhost","database":"sales","user":"reader","password":"REPLACE"}}` |
| PostgreSQL | `{"type":"postgresql","options":{"host":"localhost","database":"sales","user":"reader","password":"REPLACE","schema":"public"}}` |
| MongoDB | `{"type":"mongodb","options":{"host":"localhost","port":27017,"database":"sales"}}` |
| ClickHouse | `{"type":"clickhouse","options":{"url":"http://localhost:8123","database":"sales","username":"reader","password":"REPLACE"}}` |
| Supabase | `{"type":"supabase","options":{"accessToken":"REPLACE","projectRef":"REPLACE"}}` |

使用授权的只读凭据。临时凭据文件仅限当前用户读取，加载后删除；不要将凭据写入交付物或日志。

- **MySQL / PostgreSQL / SQLite**：通过 DuckDB 扩展接入，确保扩展可用。MySQL/PostgreSQL 可加数值 `port` 和 `ssh: { "host": "...", "user": "...", "port": 22, "password": "..." }`。
- **MongoDB**：通过 DuckDB `mongo` community extension 将 collection 映射为表，使用 SQL 而非 aggregation pipeline。支持 `user/password/authSource/srv/tls/ssl/tlsCAFile`，或用 `connection` 连接串覆盖。Atlas 可用 `srv: true`、`tls: true`。schema 来自采样，稀有字段可能遗漏，先检查实际字段和嵌套类型。
- **ClickHouse**：HTTP(S) 直连，需要 23.10+；`url` 或 `host` 至少一个，可加数值 `port`，`username` 优先于 `user`。主键和排序键不保证唯一。
- **Supabase**：通过 Management API 访问远程数据库。
