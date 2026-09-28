# 评测

评测 AVA 在不同执行方式、分析策略和 Skill 条件下的数据分析表现。已有结果见[准确率记录](ACCURACY.md)。

## 选择评测方式

| 执行方式 | 说明 | 可比较的条件 | 环境要求 |
| --- | --- | --- | --- |
| [AVA Workflow](ava-workflow/README.md) | 按固定步骤加载数据、生成画像并分析 | `direct`、`loop`、`subset` 策略 | Node.js 22.18+ |
| [AVA Agent](ava-agent/README.md) | 由模型选择工具和执行步骤 | 使用／不使用 AVA Skill | Node.js 24+、Docker |

目前支持 [DataBench](databench/README.md)，用于评测表格问答的答案准确率。它提供两种数据版本：`databench-lite` 使用采样表，`databench` 使用完整表。

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

# Agent：不使用 Skill
node evals/cli.js run ava-agent --benchmark databench --skill none --limit 20
```

默认使用 `databench-lite`。两种执行方式均支持以下选题参数：

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
- **Agent**：每次独立运行，预测结果保存到 `evals/ava-agent/.runs/<id>/predictions.csv`，详细报告位于该目录的 `.eve/evals/`。报告同时检查答案、工具调用及 Skill 加载；比较答案准确率时，应与这些执行检查区分开。

两种预测 CSV 均可离线评分，无需再次调用模型：

```bash
node evals/cli.js score --dataset databench-lite --predictions <结果.csv> --output evals/reports/<报告名>.json
```

`--dataset` 应与预测结果匹配。离线评分默认覆盖所选数据集全部题目，未提供答案的题目计为缺失；`--output` 不覆盖已有报告，省略时只在终端显示结果。

保留的评测报告位于 [`reports/`](reports/)，各条件的准确率、耗时和 token 用量汇总见[准确率记录](ACCURACY.md)。
