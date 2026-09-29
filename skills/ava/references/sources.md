# 数据源配置

## 文件与 URL

`ava source <文件路径或URL>` 根据扩展名识别 CSV、JSON、Parquet、XLSX、SQLite（`.sqlite`、`.sqlite3`、`.db`）。无法识别时添加 `--type csv-file|json-file|parquet|excel|sqlite`。Excel 每个 sheet 暴露一个视图。

普通 JSON 文件路径表示加载数据行；`@source.json` 表示读取下面的配置对象。配置文件中的相对路径基于命令工作目录。

## 配置对象

把对应对象写入 JSON 文件，执行 `ava source @source.json`；也可通过 `ava source -` 从 stdin 输入。使用配置输入时，数据类型由对象的 `type` 字段指定。

| 数据源 | 配置示例 |
| --- | --- |
| 内联行 | `{"type":"json","options":{"data":[{"region":"East","sales":10}]}}` |
| 内联 CSV | `{"type":"csv","options":{"csv":"region,sales\nEast,10"}}` |
| 文件 | `{"type":"csv-file","options":{"path":"/data/sales.csv"}}`；type 也可为 `json-file`、`parquet`、`excel`、`sqlite` |
| MySQL | `{"type":"mysql","options":{"host":"localhost","database":"sales","user":"reader","password":"REPLACE"}}` |
| MongoDB | `{"type":"mongodb","options":{"host":"localhost","port":27017,"database":"sales"}}`（或高级连接串 `{"connection":"host=localhost port=27017","database":"sales"}`） |
| PostgreSQL | `{"type":"postgresql","options":{"host":"localhost","database":"sales","user":"reader","password":"REPLACE","schema":"public"}}` |
| Supabase | `{"type":"supabase","options":{"accessToken":"REPLACE","projectRef":"REPLACE"}}` |

除 SQLite 外，文件源支持 HTTP(S) URL，并可在 `options` 中添加 `headers`。MySQL/PostgreSQL 可添加数值 `port` 和 `ssh: { "host": "...", "user": "...", "port": 22, "password": "..." }`。MongoDB 走 DuckDB `mongo` community extension，可通过结构化字段 `host`/`port`/`user`/`password`/`authSource`/`srv`/`tls`/`ssl`/`tlsCAFile` 连接，也可用 `connection` 高级连接串（`host=... port=...` 或 `mongodb://...`）覆盖；Atlas 可配合 `srv: true` 和 `tls: true`。

使用用户授权的凭据，临时凭据文件仅供当前用户读取，加载后删除。

非结构化文本由宿主提取为 JSON 行后加载，按原始文本记录可确认的值，并标注缺失和不确定性。
