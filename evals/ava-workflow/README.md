# AVA Workflow

按 `source → profile → semantic（可选）→ analyze` 执行数据分析，支持 `direct`、`loop` 两种策略。`workflow.ts` 负责分析编排，`model.ts` 提供模型配置，`evals/` 中的评测器负责适配数据和评分，通用工具位于 `../_shared/`。

## 准备

需要 **Node.js 22.18+**。以下命令均在仓库根目录执行：

```bash
npm install
npm run build
```

在仓库根目录 `.env` 中配置模型。模型名、地址和 API key 只从此文件读取，忽略进程环境变量及评测子目录的 `.env`：

```env
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=your-model
OPENAI_BASE_URL=https://your-provider.example.com/v1
```

以上三项均必填，没有默认模型或地址；启动时会打印实际模型、地址和配置文件路径，不输出 API key。请求固定携带 `chat_template_kwargs.enable_thinking: false`，服务端需支持该参数。修改 AVA 源码后需重新构建，修改编排或评测文件后可直接运行。

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

语义文件由使用者自行准备，仅保存在本地，不随仓库提交，下载器也不提供。每个选中数据库默认读取 `evals/databench/semantics/<suite>.yaml`，例如 `002_Titanic.yaml`。文件不存在时沿用 schema/profile 流程。同一份业务定义供 lite 和 full 数据使用，文件内容遵循 SDK 的 `Semantic` 类型，可包含描述、模型和字段说明、关系、视图及 cubes；统计 `metrics` 仍由 profile 提供。流程通过 `ava.semantic(undefined, setter)` 接入模型上下文。

裸数据基线使用 `--context raw`：模型初始输入只包含表 `data` 的原始 CSV 表头及前 3 行，不包含字段类型、schema 说明、profile 统计或 semantic；SQL 仍在完整表上执行。该模式仅支持 DuckDB 和 direct 策略，自动跳过 semantic YAML，并屏蔽 `analyze()` 的自动 schema 发现。Direct 默认执行错误纠正仍保留，纠错时可见的引擎诊断可能包含字段名或类型。上下文口径写入 manifest，不能与普通评测结果混用同一输出文件。

```bash
node evals/cli.js run ava-workflow --benchmark databench --dataset databench --limit all \
  --context raw --concurrency 20 --output evals/ava-workflow/results/databench-raw.csv
```

已有 YAML 在调用模型前读取并校验，内容无效时终止。文件 SHA-256 记录在 CSV 配套 manifest 中，新增、删除或修改 YAML 后须使用新的输出路径。定义描述数据含义和计算口径，可包含复用的 SQL 表达式及查询模式，不写入标答值或逐题答案；使用题目和标答辅助校准的过程应在评测记录中注明。程序化对照实验可通过 `workflow()` 的可选 `semantic` 参数传入或省略定义；批量基线可调用评测器的 `main(argv, { useSemantic: false })`，默认命令仍自动读取 YAML。

部分上游 Parquet 的统计元数据与实际记录不符，会导致 DuckDB 筛选返回错误结果；下载器会重建元数据。核验旧文件时，可在保留原文件的情况下生成缓存副本，并通过 `main(argv, { dataPaths: { [suite]: path } })` 指定；这些数据文件的哈希也会记录在 manifest 中，防止与旧结果混用。

只重跑指定错题时，程序化调用 `main(argv, { sampleIds: ['databench:002_Titanic:01', ...] })`，并用 `--limit all` 覆盖原始选择范围。ID 必须存在于 dataset/suite/offset/limit 选中的范围且不能重复或为空；所选 ID 写入 manifest，换范围须另存输出。错题重跑与旧正确结果合并时，应注明这是组合参考成绩，不能作为新一轮全量验证结果。

### Spider2-Lite 评测器

仅评测 SQLite 子集，使用 DuckDB 执行分析。先检查数据库加载、画像及评分依赖，再运行评测；`--check` 不调用模型。

默认加载 `evals/spider2lite/semantics/<数据库名>.yaml`；文件不存在时跳过；使用 `--no-semantic` 运行无业务定义的对照。实际定义哈希写入运行清单，启用状态或定义变化后须新建输出目录。来源和验证见 [Spider2-Lite 说明](../spider2lite/README.md)。

`--context raw` 仅向模型提供各个执行表/视图的名称、CSV 表头和前 3 行，以及原问题和指定的外部知识；不注入字段类型、键、画像或 semantic。查询仍执行完整数据，Direct 纠错仍启用，诊断可能包含字段名或类型。该模式仅支持 Direct，自动跳过语义文件，并用空 schema setter 阻止自动元数据发现；加载器内部仍须检查 SQLite 存储类型。表名从原生 SQLite 目录读取，避免全局目录扫描重新解析附加库视图。超出上下文或结果限制时明确失败，不截断输入。普通 `--no-semantic` 对照保留 Schema + Profile。

```bash
node evals/cli.js run ava-workflow --benchmark spider2lite --check --limit all

export SPIDER2LITE_OUTPUT="evals/ava-workflow/results/spider2lite-$(date +%Y%m%d-%H%M%S)"
node evals/cli.js run ava-workflow --benchmark spider2lite --limit all --concurrency 3 --output "$SPIDER2LITE_OUTPUT"

# 两组独立的上下文基线，输出目录须分别为空
node evals/cli.js run ava-workflow --benchmark spider2lite --context raw --limit all --concurrency 20 \
  --output evals/ava-workflow/results/spider2lite-raw
node evals/cli.js run ava-workflow --benchmark spider2lite --no-semantic --limit all --concurrency 20 \
  --output evals/ava-workflow/results/spider2lite-schema-profile
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

BIRD 默认读取 `evals/BIRD/semantics/<db_id>.yaml`，通过 `source → profile → semantic → analyze` 接入；没有文件的数据库沿用 schema/profile。文件须自行准备，使用边界见 [BIRD 语义文件](../BIRD/README.md#本地语义文件)。`--database-description` 可与 semantic 同时使用。 YAML 只描述可复用业务含义，来源题号、gold SQL 和执行答案保存在独立审计文件。BIRD 的通用 SQL、结果投影、粒度与标量输出约束在评测器中统一追加给问题，带语义和无语义模式均使用同一套约束。

```bash
node evals/cli.js run ava-workflow --benchmark bird --suite financial --check --limit all
node evals/cli.js run ava-workflow --benchmark bird --suite financial --limit all \
  --output evals/ava-workflow/results/financial-semantic
# 不加载语义文件的基线，须使用独立输出目录
node evals/cli.js run ava-workflow --benchmark bird --suite financial --limit all --no-semantic \
  --output evals/ava-workflow/results/financial-no-semantic
```

实际加载的 YAML 哈希记录在 manifest 的 `resources` 中，续跑和离线评分都会校验；启停或修改已加载的语义文件后请使用新结果目录。`--check` 同样读取并校验语义结构，不调用模型。

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
node evals/cli.js score --dataset databench-lite --predictions evals/ava-workflow/results/databench-lite.csv --output evals/reports/2026-10-22-databench-lite-glm-5.1-duckdb-direct.json
node evals/cli.js score --dataset spider2lite --predictions "$SPIDER2LITE_OUTPUT"
node evals/cli.js score --dataset bird --predictions "$BIRD_OUTPUT"
```

保存到 `evals/reports/` 时，文件名中的日期、模型和条件须与原始评测一致，命名规则见[评测说明](../README.md#查看结果)。

AVA workflow 当前不采集 token 用量，DataBench CSV 中的 token 字段留空。
