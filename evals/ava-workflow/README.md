# AVA Workflow

AVA 的固定编排实现，按 `source → profile → analyze` 执行数据分析，支持 `direct`、`loop`、`subset` 三种分析策略。

编排与评测分离：`workflow(ava, source, query, config)` 接收 AVA 实例、数据源、问题和分析配置，返回分析结果；外置评测器负责准备输入、调用编排并评分。目前接入 DataBench、Spider 2.0-Lite 的 SQLite 子集和 BIRD。

## 目录职责

- `workflow.ts`：纯编排，返回分析结果，不处理评测集和评分。
- `model.ts`：所有 Workflow 评测器共享的模型配置。
- `evals/`：外置评测器，负责数据加载、运行和评分；当前包含 `databench.eval.ts`、`spider2lite.eval.ts` 和 `bird.eval.ts`。
- `../_shared/resume.js`：BIRD 与 Spider2-Lite 共用的续跑配置校验和成功结果校验。
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
| `--engine` | `duckdb` 或 `python`；Python 需要本地 `python3`、pandas 和 pyarrow | `duckdb` |
| `--limit` | 题目数量，`all` 表示全部 | `20` |
| `--offset` | 筛选后跳过的题目数 | `0` |
| `--suite` | 指定子集，如 `002_Titanic` | 不筛选 |
| `--concurrency` | 并发数 | `3` |
| `--output` | 预测结果 CSV 路径 | `evals/ava-workflow/results/<dataset>.csv` |

复用结果文件时，先校验同名 `.csv.manifest.json` 中的数据集、模型、端点、引擎和策略配置；已有非空答案的题目会被跳过，包括答错的题目，没有答案的题目会重试。旧 CSV 没有 manifest 时仍可离线评分，但续跑须选择新的输出路径。更换模型、策略或题目范围时，请使用不同的输出文件：

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
- 离线评分的 `--output` 写入 JSON 报告，覆盖已有报告文件；省略时只在终端显示结果。

查看完整参数，不调用模型：

```bash
node evals/cli.js --help
node evals/cli.js run ava-workflow --benchmark databench --help
node evals/cli.js score --help
```

## Spider 2.0-Lite 评测器

通过 DuckDB 的 SQLite 扩展读取数据库并执行模型生成的 SQL，将 AVA 返回的数据直接写成 CSV，再由未经修改的官方 Python 评分器使用 `exec_result` 模式比较标准答案。评测结果上限为 10,000 行、64 MiB，仍被截断则记录失败；不重跑 SQL、不切换执行引擎。数据准备、依赖、结果口径和离线重评见 [Spider 2.0-Lite](../spider2lite/README.md)。

```bash
node evals/cli.js run ava-workflow --benchmark spider2lite --check --limit all

export SPIDER2LITE_OUTPUT="evals/ava-workflow/results/spider2lite-$(date +%Y%m%d-%H%M%S)"
node evals/cli.js run ava-workflow --benchmark spider2lite --limit all --concurrency 3 --output $SPIDER2LITE_OUTPUT

# 续跑已有目录，也可从少量题目扩充到全量
node evals/cli.js run ava-workflow --benchmark spider2lite --resume --limit all --concurrency 3 --output $SPIDER2LITE_OUTPUT

node evals/cli.js run ava-workflow --benchmark spider2lite --help
```

Spider2-Lite 保留复用目录自动续跑的行为，也支持显式 `--resume`。续跑跳过 SQL 和 CSV 校验通过的成功记录，重试失败和未完成题目；允许扩充题目、调整并发，模型、策略和其他运行条件须保持一致。

## BIRD 评测器

数据集介绍与下载见 [BIRD](../BIRD/README.md)。除上述准备外，需要带有标准库 `sqlite3` 的 Python 3；模型沿用本目录 `.env` 或环境变量配置。请求固定关闭思考，服务端需支持 `chat_template_kwargs.enable_thinking: false`。

### 运行与续跑

```bash
# 检查全量数据加载与画像，不调用模型
node evals/cli.js run ava-workflow --benchmark bird --check --limit all

# 全量评测；试跑可将 all 改为 3
export BIRD_OUTPUT="evals/ava-workflow/results/bird-$(date +%Y%m%d-%H%M%S)"
node evals/cli.js run ava-workflow --benchmark bird --limit all --concurrency 4 --output "$BIRD_OUTPUT"

# 中断后续跑：跳过成功结果，重试失败和未完成题目
node evals/cli.js run ava-workflow --benchmark bird --resume --limit all --concurrency 4 --output "$BIRD_OUTPUT"

# 离线重评，不调用模型
node evals/cli.js score --dataset bird --predictions "$BIRD_OUTPUT"
```

默认 `direct` 策略、20 题、并发 1。用 `--strategy direct|loop|subset` 切换策略，`--suite` 或 `--id` 筛选题目，完整参数见 `node evals/cli.js run ava-workflow --benchmark bird --help`。

首次运行使用新目录或空目录。续跑会校验模型、策略、运行环境、数据、实现版本及成功结果文件，完成后重新评分；允许扩充题目、调整并发，不允许缩小原选题范围。若强制终止后遗留 `.run.lock`，确认原进程已退出再删除。

### 结果与评分

输出目录中的 `manifest.json` 保存运行配置，`sql/` 和 `exec_result/` 保存 SQL 与实际结果，`records/` 保存单题耗时、token 用量和失败原因。`report.json` 汇总总体、各难度和各数据库准确率。

每题执行 `source → profile → analyze`。模型只接收 AVA 数据画像、问题和官方 `evidence`，不接收参考 SQL 或官方表描述。

评分比较 **AVA 在 DuckDB 上的实际结果**与**参考 SQL 在 SQLite 上的结果**，沿用 [BIRD EX 的行集合规则](https://github.com/AlibabaResearch/DAMO-ConvAI/blob/main/bird/llm/src/evaluation.py)：忽略行顺序和重复行，保留列顺序，数值无误差容忍。因此报告标记为 `ava-result-vs-sqlite-gold`，不等同于官方 SQLite EX，也不计算 VES/R-VES。

默认每个 workflow 内存上限 2 GB、查询超时 30 秒、单题评分超时 60 秒；结果上限为 10,000 行、64 MiB，截断视为失败。失败、缺失和评分错误均计零并保留在分母中，返回非零退出码；单纯答案不匹配不影响退出码。

## 用量统计

三个 Workflow 评测器共用 `_shared/usage.js`，累计单题所有 `onQueryUsage` 回调。任一调用缺失的 token 字段记为未知（CSV 留空，JSON 为 null）；subset 辅助选择器未上报的用量不包含在内。
