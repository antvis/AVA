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
├── semantics/*.yaml                  # 自行准备的本地业务定义（不提交）
├── semantics/sources.json            # 可选的本地来源审计（不传给模型、不提交）
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

Workflow 每道题执行 `source → profile → semantic（可选）→ analyze`，使用 DuckDB 引擎，通过官方 SQLite 扩展只读加载数据库。默认读取本目录 `semantics/<数据库名>.yaml`；语义文件须自行准备，不随仓库提交或下载，缺少时跳过；`--no-semantic` 可关闭这一步。输入包含 AVA 数据库画像、业务定义、原始问题和题目指定的外部知识；不向模型提供官方 `DDL.csv`、表描述 JSON、gold 或评分条件。Agent 入口不加载这些本地 YAML。

`--context raw` 运行裸数据对照：只向模型提供每个执行表/视图的名称、CSV 表头和前 3 行，以及原始问题和指定外部知识；不注入字段类型、键、schema/profile 元数据或 semantic。所有查询仍在完整数据上执行。该模式仅支持 Direct，保留正常 SQL 纠错，诊断可能透露字段名或类型；加载器内部的存储类型检查仍然执行。`--no-semantic` 则保留 Schema + Profile，作为 with schema 对照。两种模式须使用独立输出目录，详见 [Workflow 参数](../ava-workflow/README.md#spider2-lite-评测器)。

语义定义只包含可复用业务知识，不包含逐题答案；若参考 gold 校准，须注明属于样本内调优。`manifest.json` 保存定义哈希，用于拒绝混合不同输入条件的续跑。哈希不写入 report。

本地验证：`node --test evals/_shared/test.js`。共享测试覆盖基线隔离、续跑和元数据缓存，不依赖本地语义定义或完整评测集，无需调用模型。

Workflow 将 schema/profile 缓存在 `evals/ava-workflow/.cache/spider2lite/`。同一进程的并发题目共享首次计算，后续运行直接读取本地快照，通过 `ava.schema(undefined, setter)`、`ava.profile(undefined, setter)` 恢复；semantic 仍逐次读取当前 YAML。缓存键包含数据库内容哈希、元数据实现及运行时版本；数据或实现变化后重新生成，完整性或结构校验失败会明确报错。每道题仍须加载查询连接，缓存只复用元数据。缓存目录被 Git 忽略。

输出目录包含 `manifest.json`（题目、资源哈希、运行配置）、`sql/<id>.sql`（最终 SQL）、`records/<id>.json`（耗时、用量、错误）、`exec_result/<id>.csv`（DuckDB 完整执行结果）和 `report.json`。同一目录可断点续跑，成功题目跳过；模型、策略、资源或实现变化时须使用新目录。

## 与官方评分保持一致

预检会加载并扫描全部原生表和视图；部分库（如 `complex_oracle`）的原生视图关联昂贵，加载可能较慢。运行失败仍计入所选题目的分母。

模型生成和执行均使用 DuckDB，评测直接将 AVA 返回的数据写成 CSV，不重跑 SQL。评测结果上限提高为 10,000 行、64 MiB；若仍被截断，该题记录为失败，不提交不完整结果。SQL 保留用于诊断。

适配器直接调用下载的、未经修改的官方 `evaluate.py`，通过 `exec_result` 模式比较 DuckDB 完整结果 CSV；不会用 AVA 的 200 行预览评分。`condition_cols`、`ignore_order`、多份参考结果、空值和数值容差均由官方代码处理，不另写比较算法。

```bash
# 对本次运行的全部题目离线重评，不调用模型
node evals/cli.js score --dataset spider2lite \
  --predictions evals/ava-workflow/results/spider2lite-smoke

```

报告的 `accuracy` 以本次所选题目数为分母，缺失答案计零；`submittedAccuracy` 以实际提交数为分母，对应官方 CLI 的 `Final score` 口径。只跑 SQLite 子集时，不得把结果称为完整 Spider 2.0-Lite 分数。运行失败或缺失答案会返回非零退出码，单纯答错不会。

执行限制单独记录：默认 DuckDB 查询超时 30 秒、官方单题评分超时 60 秒；查询只允许只读 SQL，禁止 ATTACH、写入和扩展加载。评分器只读取提交 CSV 和标准答案，不连接数据库、不执行 SQL。

评分入口只支持结果 CSV，可传运行目录或 CSV 目录，无需选择模式。断点续跑校验 SQL 和 CSV 的哈希。旧运行的 CSV 来自 SQLite 重跑，不能视为 DuckDB 的历史结果；重新评测 AVA 请使用新的输出目录。
