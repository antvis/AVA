# DataBench

[DataBench](https://aclanthology.org/2024.lrec-main.1179/) 是面向大模型的表格问答基准，评测模型能否根据真实数据完成筛选、聚合、排序等分析并正确回答问题。最初发表于 LREC-COLING 2024，包含 65 个数据集和 1,300 组人工编写的问答，后续版本有所扩充。

它定位于**表格问答研究基准**，也用于 [SemEval 2025 Task 8](https://huggingface.co/datasets/cardiffnlp/databench)。AVA 用它衡量数据分析流程的答案准确率；评测范围不涵盖可视化、开放式报告等完整分析任务。

本目录提供共享的数据下载、加载和评分逻辑：

- `fetch.js`：下载 `databench-lite`（采样表）和 `databench`（完整表），排除 `080_Books`。
- `index.js`：统一选择题目、格式化答案，使用 `databench-answer` 指标评分；供 workflow 和 agent 的评测适配器复用。
- `datasets/lite/`、`datasets/full/`：存放下载的 `questions.csv` 和 Parquet 数据，已被 Git 忽略。

安装仓库依赖后，在仓库根目录执行（需要 `curl`）：

```bash
node evals/databench/fetch.js
```

本插件不调用 workflow 或 agent。模型配置与运行方式见 [AVA Workflow](../ava-workflow/README.md)、[AVA Agent](../ava-agent/README.md)；统一入口与离线评分见[评测说明](../README.md)。
