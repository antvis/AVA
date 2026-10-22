# 评测

评测 AVA 在不同执行方式、分析策略和 Skill 条件下的数据分析表现。已有结果统一见[站点评测文档](https://ava.antv.vision/documentation/reference/benchmarks/)。

## 选择评测方式

| 执行方式 | 说明 | 可比较的条件 | 环境要求 |
| --- | --- | --- | --- |
| [AVA Workflow](ava-workflow/README.md) | 按固定步骤加载数据、生成画像并分析 | `direct`、`loop`、`subset` 策略 | Node.js 22.18+ |
| [AVA Agent](ava-agent/README.md) | 由模型选择工具和执行步骤 | 使用／不使用 AVA Skill | Node.js 24+、Docker |

目前支持 [Spider 2.0-Lite 的 SQLite 子集](spider2lite/README.md)（Workflow／Agent、官方结果评分）、[BIRD 开发集](BIRD/README.md)（Workflow／Agent、执行结果与 SQLite 参考结果比较）及 [DataBench](databench/README.md)。DataBench 用于评测表格问答的答案准确率。它提供两种数据版本：`databench-lite` 使用采样表，`databench` 使用完整表。

## 准备环境

以下命令均在仓库根目录执行。

安装依赖并构建 AVA：

```bash
npm install
npm run build
```

运行 Agent 时，还需启动 Docker、安装 Agent 依赖并构建沙箱：

```bash
npm --prefix evals/ava-agent install
npm --prefix evals/ava-agent run sandbox:build
```

在所选方式对应的 `.env` 文件中配置模型：Workflow 使用 `evals/ava-workflow/.env`，Agent 使用 `evals/ava-agent/.env`。

```env
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=your-model
OPENAI_BASE_URL=https://your-provider.example.com/v1
```

Agent 要求以上三项均填写；Workflow 可省略 `OPENAI_BASE_URL`，默认使用 OpenAI。更多配置见各执行方式的说明。

下载评测数据（需要 `curl`，只需下载一次）：

```bash
node evals/databench/fetch.js
```

## 运行评测

通过执行对象和 `--benchmark` 选择评测组合：

```bash
# 固定编排：direct 策略
node evals/cli.js run ava-workflow --benchmark databench --strategy direct --limit 20

# Agent：使用 AVA Skill
node evals/cli.js run ava-agent --benchmark databench --skill ava --limit 20

# Agent：BIRD 和 Spider2-Lite
node evals/cli.js run ava-agent --benchmark bird --skill ava --limit 20
node evals/cli.js run ava-agent --benchmark spider2lite --skill ava --limit 20

# Agent：不使用 Skill
node evals/cli.js run ava-agent --benchmark databench --skill none --limit 20
```

BIRD 和 Spider2-Lite 的数据准备、结果目录和评分方式见 [Agent 说明](ava-agent/README.md#bird-and-spider2-lite)。以下 CSV 说明适用于 DataBench。

DataBench 默认使用 `databench-lite`。两种执行方式均支持以下选题参数：

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `--dataset` | `databench-lite` 或 `databench` | `databench-lite` |
| `--suite` | 指定子集，如 `002_Titanic` | 不筛选 |
| `--offset` | 筛选后跳过的题目数 | `0` |
| `--limit` | 题目数量，`all` 表示全部 | `20` |

比较结果时，保持模型、数据版本和题目范围一致。Workflow 更换模型或策略时，应通过 `--output` 指定新的 CSV 文件，避免复用已有答案。

查看各自的完整参数，不调用模型：

```bash
node evals/cli.js run ava-workflow --benchmark databench --help
node evals/cli.js run ava-agent --benchmark databench --help
```

## 查看结果

- **Workflow**：终端显示本次选题的准确率，预测结果默认保存到 `evals/ava-workflow/results/<dataset>.csv`。复用同一文件可续跑，已有非空答案的题目会被跳过。
- **Agent**：每次独立运行，最终预测结果保存到 `evals/ava-agent/results/<dataset>-<id>.csv`，字段与 Workflow 一致。运行中的结果位于 `.runs/<id>/predictions.csv`，详细报告位于该目录的 `.eve/evals/`；未完成的运行不生成最终结果文件。报告同时检查答案、工具调用及 Skill 加载；比较答案准确率时，应与这些执行检查区分开。

两种预测 CSV 均可离线评分，无需再次调用模型：

```bash
node evals/cli.js score \
  --dataset databench \
  --predictions evals/ava-workflow/results/databench-raw.csv \
  --metadata <(echo '{"evaluation":{"runner":"ava-workflow","engine":"duckdb","strategy":"direct","schema":false,"profile":false,"semantic":false,"model":"GLM-5.1"}}') \
  --output /tmp/databench-raw-rescored.json
```

保留的评测报告位于 [`reports/`](reports/)，各条件的准确率、耗时和 token 用量统一在[站点评测文档](https://ava.antv.vision/documentation/reference/benchmarks/)维护。

报告文件名统一为 `YYYY-MM-DD-评测集-模型-评测条件.json`，适用于 `reports/` 及其子目录。评测集、模型和条件均用小写，单词以连字符连接；模型版本保留小数点。评测集使用 `databench`、`databench-lite`、`spider2lite`、`bird`，BIRD 子集使用 `bird-financial`、`bird-toxicology`；多模型汇总使用 `multi-model`。

日期优先保留已明确记录的评测日期，否则取执行开始日期，缺少执行时间的历史报告取报告记录日期；时间戳按北京时间（UTC+8）换算，离线重评或导出不改变原评测日期。条件按执行方式／引擎、策略、上下文、实验标识排列，保留 `replay`、`retry-merged`、`comparison`、`not-retained` 等影响解释的区别。例如 `2026-10-21-databench-glm-5.1-duckdb-direct-raw.json`、`2026-10-22-bird-toxicology-glm-5.1-direct-semantic-comparison.json`。

DataBench 报告保留评测时间、关键配置及 `summary` 中的评分、耗时和 token 用量；指标的 `passed` 和 `score` 共用 `summary.total`。不输出环境版本、分组统计或失败明细，保留历史统计精度。`provenance` 只保留执行方式（`execution`）、校准说明（`calibration`）、统计口径（`statistics`）和实验限制（`limitations`），不记录审计过程和文件清理历史。通过 `--metadata` 传入这些说明；旧的 `environment` 元数据仍可读取，但不写入报告。

BIRD 报告的逐题 `status` 表示评分结果，省去重复的二元 `score`（`passed` 为 1，其他状态为 0）。BIRD 对照报告同样省去状态对应的重复分数；选中运行若已完整列入 `runs` 或 `fullRunAttempts`，通过运行路径引用。

Spider2-Lite 正式报告不输出 `items` 和 `errors`；逐题评分和执行明细保存在本地运行目录的 `report.json`、`records/` 中。

报告保留评测配置、统计结果及影响解释的实验限制，逐题明细按各评测集的约定保存。SHA-256 等校验信息仅保存在运行 manifest 和本地审计文件中，不写入报告。
