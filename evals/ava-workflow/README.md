# AVA Workflow

AVA 的固定编排实现，按 `source → profile → analyze` 执行数据分析，支持 `direct`、`loop`、`subset` 三种分析策略。

编排与评测分离：`workflow(ava, source, query, config)` 接收 AVA 实例、数据源、问题和分析配置，返回分析结果；外置评测器负责准备输入、调用编排并评分。DataBench 是目前接入的一个评测器。

## 目录职责

- `workflow.ts`：纯编排，返回分析结果，不处理评测集和评分。
- `evals/`：外置评测器，负责数据加载、运行和评分；当前包含 `databench.eval.ts`。
- `package.json`：声明 ESM，无独立依赖。

共享评测集与本目录平级，通用评测工具位于 `../_shared/`，报告位于 `../reports/`。新增评测器时，在 `evals/` 中实现输入适配和评分，复用 `workflow.ts`，并接入顶层 `evals/cli.js`。

## 准备

需要 **Node.js 22.18+**。在仓库根目录执行：

```bash
npm install
npm run build
```

以下命令均在仓库根目录执行。修改 AVA 源码后需重新构建；修改编排或评测文件后可直接运行。

## 命令入口

```bash
node evals/cli.js run ava-workflow --benchmark <评测器> [参数]
node evals/cli.js score --predictions <结果.csv> [参数]
```

`run` 选择执行对象和评测器，其他参数由对应适配器定义；`score` 按数据集的评分规则处理已有答案。数据下载由外层评测集目录中的脚本负责。

## DataBench 评测器

`evals/databench.eval.ts` 用表格问答评测编排的答案准确率，负责提示词、并发、断点续跑和结果记录。共享数据集及专属评分规则见 [DataBench](../databench/README.md)。

### 配置与运行

下载数据（需要 `curl`）：

```bash
node evals/databench/fetch.js
```

在 `evals/ava-workflow/.env` 中配置模型：

```env
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=your-model
OPENAI_BASE_URL=https://your-provider.example.com/v1
```

`OPENAI_BASE_URL` 可省略，默认使用 OpenAI。进程环境变量优先于 `.env`。

运行评测：

```bash
node evals/cli.js run ava-workflow --benchmark databench
```

默认使用 `databench-lite` 采样表、`direct` 策略，运行前 20 题。

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `--dataset` | `databench-lite` 采样表或 `databench` 完整表 | `databench-lite` |
| `--strategy` | `direct`、`loop` 或 `subset` | `direct` |
| `--limit` | 题目数量，`all` 表示全部 | `20` |
| `--offset` | 筛选后跳过的题目数 | `0` |
| `--suite` | 指定子集，如 `002_Titanic` | 不筛选 |
| `--concurrency` | 并发数 | `3` |
| `--output` | 预测结果 CSV 路径 | `evals/ava-workflow/results/<dataset>.csv` |

复用结果文件时，已有非空答案的题目会被跳过，包括答错的题目；没有答案的题目会重试。更换模型、策略或题目范围时，请使用不同的输出文件：

```bash
node evals/cli.js run ava-workflow --benchmark databench --strategy direct --output evals/ava-workflow/results/lite-direct.csv
node evals/cli.js run ava-workflow --benchmark databench --strategy loop --output evals/ava-workflow/results/lite-loop.csv
```

### 结果与评分

预测 CSV 包含答案、SQL、错误、模型、耗时和 token 用量。评分只需 `id` 和 `predicted_answer` 两列。下载的数据和生成的预测 CSV 均被 Git 忽略。

对已有结果重新评分并导出报告，不调用模型：

```bash
node evals/cli.js score --dataset databench-lite --predictions evals/ava-workflow/results/databench-lite.csv --output evals/reports/databench-lite.json
```

- `--dataset` 须与预测结果匹配。
- 离线评分默认覆盖所选数据集全部题目，未提供答案的题目计为缺失；运行评测时只评分本次选中的题目。
- 离线评分的 `--output` 写入 JSON 报告，不覆盖已有文件；省略时只在终端显示结果。

查看完整参数，不调用模型：

```bash
node evals/cli.js --help
node evals/cli.js run ava-workflow --benchmark databench --help
node evals/cli.js score --help
```
