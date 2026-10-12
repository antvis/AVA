# AVA Workflow

按 `source → profile → analyze` 执行数据分析，支持 `direct`、`loop`、`subset` 三种策略。`workflow.ts` 负责分析编排，`model.ts` 提供模型配置，`evals/` 中的评测器负责适配数据和评分，通用工具位于 `../_shared/`。

## 准备

需要 **Node.js 22.18+**。以下命令均在仓库根目录执行：

```bash
npm install
npm run build
```

在 `evals/ava-workflow/.env` 中配置模型，也可使用优先级更高的进程环境变量：

```env
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=your-model
OPENAI_BASE_URL=https://your-provider.example.com/v1
```

`OPENAI_BASE_URL` 可省略，默认使用 OpenAI。请求固定携带 `chat_template_kwargs.enable_thinking: false`，服务端需支持该参数。修改 AVA 源码后需重新构建，修改编排或评测文件后可直接运行。

按需下载数据并准备依赖：

| 评测器 | 数据准备 | 额外依赖 |
| --- | --- | --- |
| DataBench | [数据集与下载](../databench/README.md) | 使用 Python 引擎时需 Python 3、pandas、pyarrow |
| Spider2-Lite | [SQLite 子集与下载](../spider2lite/README.md) | 官方 Python 评分器及其依赖 |
| BIRD | [开发集与下载](../BIRD/README.md) | Python 3，含标准库 `sqlite3` |

## 运行评测

统一入口为 `node evals/cli.js run ava-workflow --benchmark <名称>`。默认 `direct` 策略、前 20 题；用 `--limit all` 跑全量，`--strategy` 切换策略，`--concurrency` 调整并发。完整参数用对应入口的 `--help` 查看。

### DataBench 评测器

默认使用 `databench-lite` 采样表、DuckDB 引擎、并发 3；可用 `--dataset databench` 选择完整表，`--engine python` 切换引擎。结果保存为 CSV。

```bash
node evals/cli.js run ava-workflow --benchmark databench --limit all \
  --output evals/ava-workflow/results/databench-lite.csv
```

### Spider2-Lite 评测器

仅评测 SQLite 子集，使用 DuckDB 执行分析。先检查数据库加载、画像及评分依赖，再运行评测；`--check` 不调用模型。

```bash
node evals/cli.js run ava-workflow --benchmark spider2lite --check --limit all

export SPIDER2LITE_OUTPUT="evals/ava-workflow/results/spider2lite-$(date +%Y%m%d-%H%M%S)"
node evals/cli.js run ava-workflow --benchmark spider2lite --limit all --concurrency 3 --output "$SPIDER2LITE_OUTPUT"
```

### BIRD 评测器

使用 DuckDB 分析 SQLite 数据库。模型输入为 AVA 数据画像、问题和官方 `evidence`，不包含参考 SQL 或官方表描述。

```bash
node evals/cli.js run ava-workflow --benchmark bird --check --limit all

export BIRD_OUTPUT="evals/ava-workflow/results/bird-$(date +%Y%m%d-%H%M%S)"
node evals/cli.js run ava-workflow --benchmark bird --limit all --concurrency 4 --output "$BIRD_OUTPUT"
```

Spider2-Lite 和 BIRD 默认并发 1，可用 `--suite` 或 `--id` 筛选题目。查询默认超时 30 秒、单题评分超时 60 秒；Spider2-Lite 结果上限为 10,000 行，BIRD 为 1,000,000 行，两者均限制 64 MiB，截断视为失败。BIRD 每个 workflow 默认内存上限 2 GB，可用 `--memory-limit` 调整。

BIRD 可加 `--database-description`，将所选数据库 `database_description/` 下的 CSV 字段说明加入模型上下文；默认不加入。说明文件的哈希会记录在 manifest 中。对比实验请使用新的结果目录。

## 中断后续跑

**DataBench**：重新执行原命令，复用同一 CSV。校验配套 manifest 后，跳过已有非空答案（包括答错的题目），重试无答案题目。更换模型、策略或题目范围时使用新文件；旧 CSV 缺少 manifest 时只能离线评分。

**Spider2-Lite / BIRD**：指定原结果目录和 `--resume`，校验运行配置、实现版本及成功结果文件，跳过成功记录，重试失败和未完成题目，最后重新评分。允许扩充题目和调整并发，不允许缩小原选题范围；BIRD 还会校验数据哈希。

```bash
node evals/cli.js run ava-workflow --benchmark spider2lite --resume --limit all --concurrency 3 --output "$SPIDER2LITE_OUTPUT"
node evals/cli.js run ava-workflow --benchmark bird --resume --limit all --concurrency 4 --output "$BIRD_OUTPUT"
```

这里的变量须指向原目录，重新打开终端后需重新赋值。BIRD 首次运行要求新目录或空目录；Spider2-Lite 也保留复用目录自动续跑的行为。若强制终止后遗留 `.run.lock`，确认原进程退出再删除。

## 结果与评分

DataBench 的 CSV 保存答案、SQL、错误、耗时和 token 用量。Spider2-Lite / BIRD 使用结果目录：`manifest.json` 保存运行配置，`sql/` 保存 SQL，`exec_result/` 保存实际结果（分别为 CSV / JSON），`records/` 保存单题记录，`report.json` 汇总准确率。

| 评测器 | 评分口径 |
| --- | --- |
| DataBench | 按数据集规则比较答案；运行时只评分选中题目，离线评分默认覆盖所选数据集全部题目 |
| Spider2-Lite | 官方评分器以 `exec_result` 模式比较 AVA 实际返回的 CSV 与标准答案，不重跑 SQL |
| BIRD | 比较 AVA 的 DuckDB 实际结果与参考 SQL 的 SQLite 结果，忽略行顺序和重复行，保留列顺序，数值无误差容忍 |

BIRD 报告标记为 `ava-result-vs-sqlite-gold`，不等同于官方 SQLite EX，也不计算 VES/R-VES。失败、缺失和评分错误均计零并保留在分母中，返回非零退出码；单纯答案不匹配不影响退出码。

以下命令仅重评已有结果，不调用模型。DataBench 的 `--dataset` 须与预测匹配；BIRD 按原 manifest 选题并校验数据哈希。

```bash
node evals/cli.js score --dataset databench-lite --predictions evals/ava-workflow/results/databench-lite.csv --output evals/reports/databench-lite.json
node evals/cli.js score --dataset spider2lite --predictions "$SPIDER2LITE_OUTPUT"
node evals/cli.js score --dataset bird --predictions "$BIRD_OUTPUT"
```

Token 用量累计单题所有 `onQueryUsage` 回调；缺失字段记为未知（CSV 留空、JSON 为 null），不包含 subset 辅助选择器未上报的用量。
