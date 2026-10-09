# 查询与结果约定

## 执行查询

从 `ava schema` 获取实际表名、字段和 `language`，按 `language.name` 及可选的 `language.instructions` 编写查询。查询文件保存为 UTF-8，通过 `--dsl` 执行：

```sh
ava query "$DATASET_ID" --dsl @query.sql > result.json
```

Python、JavaScript 示例可分别保存为 `query.py`、`query.js`，执行方式相同。文件后缀不改变会话引擎。下文只读当前语言和结果部分，示例名称替换为实际表名和字段。

## SQL

按会话方言编写单条只读 SELECT，可含只读 CTE，仅访问已加载的表与字段。

```sql
SELECT region, SUM(amount) AS total
FROM sales
GROUP BY region
ORDER BY total DESC, region;
```

ClickHouse 不添加 `FORMAT`、`SETTINGS` 或 `INTO OUTFILE`，由 AVA 包装执行。

## Python / pandas

| 绑定 | 用法 |
| --- | --- |
| `pd` | 已导入的 pandas |
| `tables` | 以 schema 表名为键的 DataFrame 字典，如 `tables['Orders']` |
| `df` | 仅在一个表时提供；多表从 `tables` 明确取表 |
| `result` | 必须赋值；支持 DataFrame、Series、记录列表、单条记录或 JSON 标量；标量输出位于 `data[0].value` |

- 在已加载的 DataFrame 上计算，不另读写文件、访问网络、安装包或打印答案。
- 每次查询重新读取来源，不保留上次变量或修改；所需转换写在同一查询中。默认执行超时 30 秒，本地子进程超时会被终止。
- DataFrame / Series 索引不随结果返回。需要保留索引值时使用 `reset_index()`，分组时也可用 `as_index=False`。

例如按地区求和，保留缺失地区和全空金额：

```python
result = (
    df.groupby('region', dropna=False, as_index=False)['amount']
      .sum(min_count=1)
      .rename(columns={'amount': 'total'})
)
```

## JavaScript

输入为 `data` 数组，提供 `stat` 统计对象，最终声明 `result`，使用对象数组作为输出。以下示例假定 `amount` 均为数值：

```javascript
const result = [{ total: data.reduce((sum, row) => sum + row.amount, 0) }];
```

每次执行使用输入副本，不保留上次变量或修改；不能使用 Node.js 文件、网络或包加载 API。`stat` 的部分数值函数将无法转成数值的值作为零，空值重要时显式处理。

## 结果与后处理

命令成功后读取返回的 JSON：

- `data` 是答案数据，用于回答、制图或后处理；`schema` 描述结果列。
- `truncated: true` 表示结果不完整，`truncatedBy` 给出原因；未截断时这两个字段可省略。
- `rowCount` 是当前查询结果行数，不是源表总行数；截断时省略。

默认返回上限为 200 行、1 MiB。可用 `--max-rows`（最多 10000）和 `--max-result-bytes` 调整；单个字段仍限 1 MiB。这些限制仅作用于返回数据，聚合与统计应在执行器内完成，不能用截断、LIMIT 或抽样的明细代替全量统计。

跨引擎后处理时，确认结果完整后，将 `data` 保存为 JSON 数组再加载，不要加载整个结果对象。保留生成中间数据的查询和口径；未截断也不代表查询覆盖了全部源数据。
