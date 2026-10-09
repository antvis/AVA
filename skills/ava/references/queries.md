# 查询与结果约定

以 `ava schema` 返回的 `language.name`、`language.fence` 和可选的 `language.instructions` 为准，只读当前语言部分。查询统一使用 `ava query "$DATASET_ID" --dsl @文件`；文件后缀不改变引擎。

## SQL

按会话方言编写单条只读 SELECT，可含只读 CTE，仅访问已加载的表与字段。

例如 schema 已确认 `sales` 表含 `region`、`amount`：

```sql
SELECT region, SUM(amount) AS total
FROM sales
GROUP BY region
ORDER BY total DESC, region;
```

按实际 schema 替换名称。需要稳定顺序时显式 `ORDER BY`，排名说明并列规则；零分母用 NULL 表示未定义，全空金额与零分开处理。ClickHouse 不添加 `FORMAT`、`SETTINGS` 或 `INTO OUTFILE`，由 AVA 包装执行。

## Python / pandas

| 绑定 | 用法 |
| --- | --- |
| `pd` | 已导入的 pandas |
| `tables` | 以 schema 表名为键的 DataFrame 字典；CSV/JSON/Parquet 为 `data`，Excel 为各 sheet 名 |
| `df` | 仅在一个表时提供；多表从 `tables` 明确取表 |
| `result` | 必须赋值；支持 DataFrame、Series、记录列表、单条记录或 JSON 标量 |

在已加载数据上计算，不另读写文件、访问网络、安装包或打印答案。每次执行从原始输入开始，不保留变量或修改，所需转换须包含在当前查询中。

Python 默认执行超时 30 秒，本地子进程超时会被终止。加载时的结构探测、每次查询和画像都会读取来源；`ava schema` 返回已缓存的结构。来源可能变化时，在授权范围内保存本地快照以保证可复现。结果限额不限制输入规模，大数据的简单聚合优先使用数据库或 DuckDB。

DataFrame / Series 索引不随结果返回。保留分组键用 `as_index=False` 或 `reset_index()`，并给指标命名。例如将缺失地区单独成组、全空金额保留为空：

```python
result = (
    df.groupby('region', dropna=False, as_index=False)['amount']
      .sum(min_count=1)
      .rename(columns={'amount': 'total'})
      .sort_values(['total', 'region'], ascending=[False, True], na_position='last')
)
```

保存为 `query.py` 后执行 `ava query "$DATASET_ID" --dsl @query.py > result.json`。

注意 pandas 的分析语义：

- **空值**：`groupby` 默认丢弃空分组键，保留时用 `dropna=False`；`size()` 计记录，`count()` 计非空值；全空求和需用 `min_count=1` 保留缺失。类型转换后检查失败数量。
- **关联**：用 `merge(validate=...)` 检查预期的一对一或多对一关系。pandas 会匹配两侧的空键，与 SQL 等值关联不同，需按业务口径处理。
- **整形**：区分真实 list/array 与列表字符串；`explode` 后重新确认行粒度。时间序列先解析、排序，再做差分或滚动计算。
- **序列化**：标量通常位于 `data[0].value`；JSON 不保留原生 pandas 类型和无限精度，精确标识符或 Decimal 需核对实际输出。

## JavaScript

仅用于已有 JavaScript 会话或用户明确指定的计算。输入为 `data` 数组，提供 `stat` 统计对象，最终声明 `result`。为与表格处理和制图一致，返回对象数组：

```javascript
const result = [{ total: data.reduce((sum, row) => sum + row.amount, 0) }];
```

示例假定 `amount` 均为数值。`stat` 的部分数值函数将无法转成数值的值作为零，空值重要时显式处理。每次执行使用输入副本，不保留上次变量或修改；不能使用 Node.js 文件、网络或包加载 API。

## 结果与后处理

所有引擎返回相同的结果包装；按上述输出约定读取：

| 字段 | 含义 |
| --- | --- |
| `data` | 结果记录数组，用于回答、制图或后处理 |
| `schema` | 结果列，不是源表结构 |
| `truncated` / `truncatedBy` | 截断时返回标记及原因；未截断时可省略 |
| `rowCount` | 完整查询结果的行数；截断时省略，不表示源表总行数 |

默认最多返回 200 行、1 MiB；可用 `--max-rows`（上限 10000）和 `--max-result-bytes` 调整，单个字段仍限 1 MiB。即使未截断，查询中的 LIMIT、head、抽样或筛选仍限定数据范围，局部明细不能代替全量统计。

跨引擎后处理时，先确认结果完整，再只导出 `data`，不要加载整个结果包装；保留生成中间数据的查询及口径：

```sh
node -e 'const fs = require("fs"); const r = JSON.parse(fs.readFileSync("result.json", "utf8")); if (r.truncated) throw new Error("Query result is truncated"); fs.writeFileSync("rows.json", JSON.stringify(r.data), { flag: "wx" });'
ava source rows.json --engine python > python-session.json
```
