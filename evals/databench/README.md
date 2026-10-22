# DataBench

[DataBench](https://aclanthology.org/2024.lrec-main.1179/) 是面向大模型的表格问答基准，评测模型能否根据真实数据完成筛选、聚合、排序等分析并正确回答问题。最初发表于 LREC-COLING 2024，包含 65 个数据集和 1,300 组人工编写的问答，后续版本有所扩充。

它定位于**表格问答研究基准**，也用于 [SemEval 2025 Task 8](https://huggingface.co/datasets/cardiffnlp/databench)。AVA 用它衡量数据分析流程的答案准确率；评测范围不涵盖可视化、开放式报告等完整分析任务。

本目录提供共享的数据下载、加载和评分逻辑：

- `fetch.js`：下载 `databench-lite`（采样表）和 `databench`（完整表），排除 `080_Books`。通过 DuckDB 重写本地 Parquet 副本以重建统计元数据，避免上游错误的 min/max 导致筛选遗漏实际记录；记录值不作修改。
- `index.js`：统一选择题目、格式化答案，使用 `databench-answer` 指标评分；供 workflow 和 agent 的评测适配器复用。
- `datasets/lite/`、`datasets/full/`：存放下载的 `questions.csv` 和 Parquet 数据，已被 Git 忽略。
- `semantics/<suite>.yaml`：使用者自行准备的本地 `Semantic` 定义，不随仓库提交或下载，由 ava-workflow 自动加载。不存在对应文件时沿用 schema/profile 流程。

归档的语义增强实验参考了当前评测题目和标答，属于样本内调优结果，不能视为未见题目的泛化准确率；评分仍使用原标答。

安装仓库依赖后，在仓库根目录执行（需要 `curl`）：

```bash
node evals/databench/fetch.js
```

本插件不调用 workflow 或 agent。模型配置与运行方式见 [AVA Workflow](../ava-workflow/README.md)、[AVA Agent](../ava-agent/README.md)；统一入口与离线评分见[评测说明](../README.md)。
