# Spider 2.0-Lite

[Spider 2.0-Lite](https://github.com/xlang-ai/Spider2/tree/main/spider2-lite) 是面向真实企业场景的 Text-to-SQL 基准，要求结合自然语言问题、数据库结构与外部知识生成 SQL，涵盖 SQLite、BigQuery 和 Snowflake。

已核验版本包含 **547 道题**，其中 **135 道 `local*` 题目**使用 **30 个 SQLite 数据库**。本地 SQLite 只是子集，不能代表完整基准；数据规模可能随上游更新。

## 下载数据

### 1. 获取题目与资源

需要 Node.js 22.13+ 和支持 sparse-checkout 的 `git`，无需额外 npm 依赖。在仓库根目录执行：

```bash
node evals/spider2lite/fetch.js
```

脚本从官方仓库 `main` 分支下载题目、完整 `resource/` 和 `evaluation_suite/`（含原版评分器），不下载或解压 SQLite 数据库。可用 `--revision <完整 commit SHA>` 固定版本；`upstream.json` 记录版本及文件哈希。

### 2. 手动准备 SQLite 数据库

打开官方 [Google Drive 下载链接](https://drive.usercontent.google.com/download?id=1coEVsCZq-Xvj9p2TnhBFoFTsY-UoYGmG&export=download&authuser=0)，下载 `local_sqlite.zip`（约 435 MB）。Google Drive 可能提示文件过大、无法扫描病毒，确认来源后可选择继续下载。

用系统解压工具解压 ZIP，将其中**所有 `.sqlite` 文件**按原文件名直接放到以下目录，不额外嵌套 ZIP 的顶层文件夹：

```text
evals/spider2lite/resource/databases/spider2-localdb/
```

例如最终路径应为 `resource/databases/spider2-localdb/AdventureWorks.sqlite`。当前版本应有 30 个数据库文件；仅运行 `fetch.js` 不代表 SQLite 数据已准备完毕。

## 目录与内容

内部路径沿用上游命名，`resource/` 和 gold 不做裁剪；SQLite 文件按官方 Quickstart 放置：

```text
evals/spider2lite/
├── fetch.js
├── README.md
├── spider2-lite.jsonl                 # 题目
├── resource/
│   ├── databases/                    # 数据库结构与描述
│   │   └── spider2-localdb/*.sqlite   # 实际 SQLite 数据文件
│   ├── documents/                    # 题目相关文档
│   ├── documentation/                # 外部知识、SQL 方言与函数文档
│   └── interface/                    # 上游数据库接口
└── evaluation_suite/
    ├── evaluate.py                   # 原版官方评分器
    └── gold/
        ├── spider2lite_eval.jsonl         # 评分元数据，文件名没有连字符
        ├── exec_result/                  # 参考执行结果
        └── sql/                          # 参考 SQL（上游提供时下载）
```

题目字段为 `instance_id`（题目 ID）、`db`（数据库）、`question`（问题）和 `external_knowledge`（外部知识文件引用）。数据库描述与外部知识属于解题输入；gold 用于评分，不应提供给模型。

## 下载行为与评测边界

- 脚本下载并校验题目与评分元数据后，才复制到本目录；不校验手动放置的 SQLite 文件，也不执行 SQL。
- 重复下载覆盖同名文件，不清理上游已删除的旧文件。成功后输出 Git commit，便于记录版本；独立下载的 SQLite ZIP 不受该 commit 固定。
- 下载的 `resource/`、`evaluation_suite/`、`upstream.json`、虚拟环境和根目录 JSONL 均被 Git 忽略。
- BigQuery、Snowflake 数据不包含在 SQLite ZIP 中，需按官方 [BigQuery 指南](https://github.com/xlang-ai/Spider2/blob/main/assets/Bigquery_Guideline.md)和 [Snowflake 指南](https://github.com/xlang-ai/Spider2/blob/main/assets/Snowflake_Guideline.md)配置访问权限，查询可能产生费用。
- 官方评分器为 Python，参见[评测说明](https://github.com/xlang-ai/Spider2/tree/main/spider2-lite/evaluation_suite)。下载脚本只准备资源；以下入口负责运行 AVA 与评分。不能仅凭 gold CSV 数量判断题目覆盖率。

## 运行 SQLite 子集评测

需要 Node.js **22.18+**，以及安装了 pandas、google-cloud-bigquery、tqdm 的 Python（BigQuery 包是上游评分器的导入依赖，SQLite 评测不连接云数据库）：

```bash
python3 -m venv evals/spider2lite/.venv
evals/spider2lite/.venv/bin/python -m pip install pandas google-cloud-bigquery tqdm
npm run build

# 检查全部 SQLite 题目的资源、官方评分器及数据库是否可加载，不调用模型
node evals/cli.js run ava-workflow --benchmark spider2lite --check --limit all

# 使用 evals/ava-workflow/.env 中的模型配置，先运行三道真题
node evals/cli.js run ava-workflow --benchmark spider2lite --limit 3 \
  --output evals/ava-workflow/results/spider2lite-smoke

# 全量 SQLite 子集
node evals/cli.js run ava-workflow --benchmark spider2lite --limit all \
  --output evals/ava-workflow/results/spider2lite-full
```

模型配置和 `direct`、`loop`、`subset` 策略见 [AVA Workflow](../ava-workflow/README.md)。默认 `direct`、20 题、并发 1；可用 `--id local002`（可重复）、`--suite <数据库名>`、`--offset` 选题。完整参数用 `--help` 查看。

每道题均执行 `source → profile → analyze`，使用 DuckDB 引擎，通过官方 SQLite 扩展只读加载数据库，输入仅包括 AVA 数据库画像、原始问题和题目指定的外部知识；不向模型提供官方 `DDL.csv` 或表描述 JSON，预检也不再要求这些描述文件。输入条件记录在运行清单中，与旧版结果比较时需注意这一变化。gold 和评分条件不传给模型。

输出目录包含 `manifest.json`（题目、资源哈希、运行配置）、`sql/<id>.sql`（最终 SQL）、`records/<id>.json`（耗时、用量、错误）、`exec_result/<id>.csv`（官方执行结果）和 `report.json`。同一目录可断点续跑，成功题目跳过；模型、策略、资源或实现变化时须使用新目录。

## 与官方评分保持一致

当前 DuckDB 加载 `stacking.sqlite` 的 `stack_ok` 视图会报语法错误，包含该库的预检会失败。

模型生成和 AVA 执行使用 DuckDB SQL 方言，官方评分使用 SQLite；DuckDB 专有语法可能在官方重跑时失败，不做自动方言转换。

适配器直接调用下载的、未经修改的官方 `evaluate.py`：`sql` 模式重新执行最终 SQL，然后按官方规则比较完整 CSV；不会用 AVA 的 200 行预览评分。`condition_cols`、`ignore_order`、多份参考结果、空值和数值容差均由官方代码处理，不另写比较算法。

```bash
# 对本次运行的全部题目离线重评，不调用模型
node evals/cli.js score --dataset spider2lite \
  --predictions evals/ava-workflow/results/spider2lite-smoke

# 同一运行的官方执行结果也可按官方 CSV 模式重评
node evals/cli.js score --dataset spider2lite --mode exec_result \
  --predictions evals/ava-workflow/results/spider2lite-smoke \
  --output evals/ava-workflow/results/spider2lite-smoke/report-csv.json
```

报告的 `accuracy` 以本次所选题目数为分母，缺失答案计零；`submittedAccuracy` 以实际提交数为分母，对应官方 CLI 的 `Final score` 口径。只跑 SQLite 子集时，不得把结果称为完整 Spider 2.0-Lite 分数。运行失败或缺失答案会返回非零退出码，单纯答错不会。

执行限制单独记录：默认 DuckDB 查询超时 30 秒、官方单题评分超时 60 秒；查询只允许只读 SQL，禁止 ATTACH、写入和扩展加载。上游 CLI 的 SQLite 路径与其 README 有差异，桥接层按官方 README 将数据库目录明确传入评分函数，不改写评分代码。
