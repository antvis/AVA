# 评测

执行对象与评测插件相互独立，通过各自的适配器接入：

- [AVA Workflow](ava-workflow/README.md)：固定的 `source → profile → analyze` 编排。
- [AVA Agent](ava-agent/README.md)：由模型决定执行步骤，使用 Eve 管理会话与沙箱。
- [DataBench](databench/README.md)：共享题目、数据选择、答案格式和评分规则，不依赖执行对象。

`cli.js` 是统一入口；`_shared/` 提供通用评测工具；`reports/` 保存比较报告。每个执行对象的 `evals/` 负责适配其输入、运行方式和输出。

调用关系：`CLI 接入表 → 目标的评测适配器 → workflow / Eve`。CLI 只选择适配器，DataBench 插件只提供题目和评分。Agent 的 `databench.eval.ts` 统一处理参数、快照、Eve 配置和用例；`scripts/run.mjs` 只管理 Eve、沙箱和进程。

## 运行

先按各执行对象的说明安装依赖、构建并配置模型。以下命令在仓库根目录执行：

```bash
node evals/databench/fetch.js
node evals/cli.js run ava-workflow --benchmark databench --limit 20
node evals/cli.js run ava-agent --benchmark databench --limit 20 --skill ava
node evals/cli.js run ava-agent --benchmark databench --limit 20 --skill none
```

两边共用 `--dataset`、`--suite`、`--offset` 和 `--limit` 的题目选择规则。Workflow 需要 Node.js 22.18+；Agent 需要 Node.js 24+ 和 Docker。

比较时使用相同的数据版本、题目范围与模型，比较 DataBench 答案准确率。Agent 的 Skill 加载、工具调用等检查属于额外执行约束，不等同于答案准确率。

## 结果

- Workflow：预测 CSV 位于 `ava-workflow/results/`，支持复用文件续跑。
- Agent：每次创建独立的 `ava-agent/.runs/<id>/`，包含 `predictions.csv`、Eve 报告及运行快照。

两种预测 CSV 均可通过统一入口离线评分：

```bash
node evals/cli.js score --dataset databench-lite --predictions <结果.csv> --output evals/reports/<报告名>.json
```

离线评分默认覆盖所选数据集全部题目，部分预测会产生缺失项；`--output` 不覆盖已有报告。具体参数见 `node evals/cli.js --help` 或 `run <执行对象> --benchmark databench --help`。
