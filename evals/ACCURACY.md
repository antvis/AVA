# Benchmark

## DataBench

面向表格问答，衡量筛选、聚合、排序等数据分析的答案正确性。使用完整表，共 1,789 题（排除 `080_Books`），模型为 GLM-5.1。

| 模型 | Workflow · Python · Direct + Profile | Agent + AVA Skill | Workflow · Direct | Workflow · Direct + Profile | Workflow · Subset + Profile | Workflow · Loop |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| GLM-5.1 | 85.41% | 84.46% | 84.46% | 86.64% | 86.70% | 84.07% |

[原始报告](reports/)

## BIRD New Dev

面向真实数据库的 Text-to-SQL，衡量字段理解、多表关联及查询结果正确性。使用 New Dev（`dev_20251106`）1,534 题、11 个数据库，执行方式为 AVA Workflow。

| 模型 | Workflow · Direct | Workflow · Loop |
| --- | ---: | ---: |
| GLM-5.1 | 63.10% | 65.84% |
| GLM-5.2 | 65.38% | 67.14% |
| GLM-5.3 | 68.12% | — |
| Kimi-K2.5 | 61.34% | 59.00% |
| Kimi-K3 | 66.10% | 64.73% |

[官方榜单](https://bird-bench.github.io/) · [原始报告](reports/BIRD/newdev-20261012/)

## Spider2-Lite SQLite 子集

面向企业场景的复杂 Text-to-SQL，衡量复杂查询的生成、执行及结果正确性。本次使用 135 道 SQLite 子集题目，由官方评分器比较执行结果。

| 模型 | Workflow · Direct |
| --- | ---: |
| GLM-5.1 | 27.41% |

[官方榜单](https://spider2-sql.github.io/)
