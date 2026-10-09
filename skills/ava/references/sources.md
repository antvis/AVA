# 数据源

## 引擎选择

| 数据来源 | 引擎 | 查询语言 |
| --- | --- | --- |
| CSV/JSON/Parquet/Excel 文件、内联 CSV/JSON | 默认 DuckDB；可选 Python | DuckDB SQL / Python（pandas） |
| MySQL、PostgreSQL、SQLite、MongoDB | 默认 DuckDB | DuckDB SQL |
| ClickHouse | 自动选择 ClickHouse | ClickHouse SQL |
| Supabase | 自动选择 Supabase | PostgreSQL SQL |
| 内联 CSV/JSON/text | 用户指定时可选 JavaScript | JavaScript |

需要 Python 或 JavaScript 时，在 `source` 命令上加 `--engine python` 或 `--engine javascript`。Python 不直接连接数据库；需用 pandas 后处理时，先查询数据库，再按[结果与后处理](queries.md#结果与后处理)导出完整结果。

## 文件与配置

**普通文件或 URL 直接加载：**

```sh
ava source /data/sales.csv > session.json
```

CLI 按扩展名识别 CSV、JSON、Parquet、XLSX、SQLite（`.sqlite`、`.sqlite3`、`.db`）；无法识别时，用 `--type` 指定 `csv-file`、`json-file`、`parquet`、`excel` 或 `sqlite`。SQLite 仅支持本地文件，其余文件源支持 HTTP(S)。Excel 每个 sheet 为一张表，实际表名以 schema 为准。

**内联数据、认证或自定义读取选项使用配置：**

配置包含 `type` 和 `options`。`type` 是数据格式或数据库类型，不是引擎。例如，读取分号分隔的 CSV 并保留文本类型，将以下内容保存为 `source.json`：

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

普通 `.json` 文件按数据行读取，只有 `@文件` 或 stdin `-` 才按配置读取；配置输入不能同时使用 `--type`。相对路径以命令工作目录为基准。不同引擎支持的读取选项可能不同。

其他常用配置按下表填写 `type` 和 `options`：

| 用途 | `type` | `options` 示例 |
| --- | --- | --- |
| JSON 行 | `json` | `{"data":[{"region":"East","sales":10}]}` |
| 内联 CSV | `csv` | `{"csv":"region,sales\nEast,10"}` |
| 认证 URL | `json-file` | `{"path":"https://example.com/data.json","headers":{"Authorization":"Bearer REPLACE"}}` |

非结构化文本可先提取成 JSON 行，仅保留原文支持的信息。原生 `text` 来源会调用 AVA 内部模型，需要额外模型配置。

## 数据库

数据库沿用上述配置格式和加载命令：

| `type` | `options` 示例 |
| --- | --- |
| `mysql` | `{"host":"localhost","database":"sales","user":"reader","password":"REPLACE"}` |
| `postgresql` | `{"host":"localhost","database":"sales","user":"reader","password":"REPLACE","schema":"public"}` |
| `mongodb` | `{"connection":"mongodb://localhost:27017","database":"sales"}` |
| `clickhouse` | `{"url":"http://localhost:8123","database":"sales","username":"reader","password":"REPLACE"}` |
| `supabase` | `{"accessToken":"REPLACE","projectRef":"REPLACE"}` |

使用授权的只读凭据。临时凭据文件仅限当前用户读取，加载后删除；不要将凭据写入交付物或日志。

- MySQL、PostgreSQL、SQLite 和 MongoDB 依赖相应的 DuckDB 扩展；MongoDB 使用 `mongo` 社区扩展，每个 collection 为一张表，schema 来自采样，稀有字段可能遗漏。
- ClickHouse 通过 HTTP(S) 连接，需要 23.10+。
- Supabase 使用 Management API，`accessToken` 应为该 API 的访问令牌。
