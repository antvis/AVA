---
name: ava
description: Run one AVA CLI analysis against a supported data source and optionally write an HTML chart.
---

# AVA CLI 数据分析

## 准备

1. 确定一个数据源和一个分析问题。
2. 确认 `ava`、`OPENAI_API_KEY`、`OPENAI_MODEL` 和 `OPENAI_BASE_URL` 可用；缺失时按 [AVA 配置](references/setup.md) 处理。
3. AVA 会向配置的模型服务发送字段结构、统计信息、类别示例和查询结果。

## 执行

本地路径转为绝对路径，HTTP(S) URL 保持原样。每次调用都提供完整问题；追问需包含相关筛选条件、指标口径和比较范围。

```sh
ava analyze "<数据源>" "<问题>" [options]
```

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `<数据源>` | 是 | 单个本地路径或 HTTP(S) URL |
| `<问题>` | 是 | 完整的自然语言分析问题 |
| `--type <类型>` | 否 | 无法判断格式时指定 `csv-file`、`json-file`、`parquet` 或 `excel` |
| `--chart` | 否 | 生成图表 |
| `--output <路径>` | 使用 `--chart` 时 | 将图表写入新的 HTML 文件 |

命令未退出时继续读取同一进程的输出。

## 结果

| 字段 | 用途 |
| --- | --- |
| `analysis.data` | 分析结果 |
| `analysis.text` | 结果说明 |
| `analysis.sql` | 执行的 SQL，按请求提供 |
| `visualization` | 图表信息；HTML 文件存在时提供输出文件 |

命令失败或未返回结果时，报告原始错误。
