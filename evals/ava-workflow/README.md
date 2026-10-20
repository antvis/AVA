# AVA Workflow

按 `source → profile → analyze` 执行数据分析（semantic 跳过 profile，直接通过语义工具探索），支持 `direct`、`loop`、`subset`、`semantic` 四种策略。`workflow(ava, source, query, config = {})` 直接接收 AVA 的 `AnalysisConfig`。`strategies.ts` 集中评测策略参数和资源准备，由评测入口在调用 workflow 前完成注册；`workflow.ts` 负责分析编排，`model.ts` 提供模型配置，`evals/` 中的评测器负责适配数据和评分，通用工具位于 `../_shared/`。

## 扩展策略

AVA 核心实现新策略后，在 `strategies.ts` 的 `strategies` 表中添加一项即可接入评测。普通策略只需 `config(options)` 返回 AVA 策略配置；需要额外资源时再实现 `prepare(options, sources)`，返回逐题 `setup`、运行 `manifest`、`modelContext`、资源哈希、`saveArtifacts` 和逐题 `record` 中需要覆盖的部分。初始化每次运行只执行一次，`setup` 由评测入口在每题调用 workflow 前执行，此时数据尚未加载；策略资源不应在并发题目之间修改。

三个评测入口共用 `strategyOptions` / `strategyHelp`。新参数也在这里定义，不在各入口添加策略判断。数据适配只提供文件路径、类型和必要的标识，不向策略准备阶段传递标答；新策略沿用这些输入时，无需修改 `evals/*.eval.ts`。策略代码会计入实现哈希，改动后使用新输出路径。

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

以上三项均必填，没有默认模型或地址；启动时会打印实际模型、地址和配置文件路径，不输出 API key。默认 `--thinking provider`，不覆盖服务端推理设置；`--thinking on|off` 显式发送 `chat_template_kwargs.enable_thinking`，仅用于支持该参数的服务。semantic 还支持 `--temperature` 和 `--max-output-tokens`。模型设置写入各评测器的 manifest；使用 Gemini 等提供商专用推理参数时，应配置对应 SDK model 和 `llm.providerOptions`，不能把 `enable_thinking` 当成通用协议。修改 AVA 源码后需重新构建，修改编排或评测文件后可直接运行。

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

### 语义层配置

`--strategy semantic` 在 DataBench 中读取 `evals/databench/semantics/<suite>.yaml`，例如 `001_Forbes.yaml`。文件缺失或配置无效时直接报错，不回退到旧 JSON 或规则生成。配置区分 dimensions（属性）、measures（行级量）和 metrics（预定义聚合或派生指标）。配置快照及原文件内容哈希写入运行记录，续跑时校验。Forbes 配置参考了 full 数据及标答，评测结果应注明此条件。

BIRD 读取 `evals/BIRD/semantics/<db_id>.yaml`；配置依据实际数据库、官方字段说明及 golden SQL 整理，属于参考答案知情条件，详见 [配置依据与限制](../BIRD/semantics/README.md)。文件缺失或无效直接失败。

Spider2-Lite 仍在模型调用前从实际 schema 自动生成基础语义层，每个数据源生成一次，按题目注册到 workflow。每张表对应一个 model，数值字段对应 measures，其余字段对应 dimensions；行数和数值字段的 `sum / avg / min / max / count_distinct` 对应 metrics。此处仅按物理类型生成基线，不推断数值 ID 的业务含义；DataBench 的元素分类则由人工确定。复用 AVA 的字段类型识别；不根据问题或参考答案生成指标。标识符会规范化并消除重名，物理列名保持原样；joins 只来自真实外键，保留复合键。

当前仅支持 DuckDB。物理表名必须满足现有 SMQ 编译器的标识符限制，自连接外键也尚不支持；遇到这类结构会在模型调用前报错，不会静默丢弃。自动聚合没有业务口径或连接基数保证，因此这一条件衡量基础语义层流程，不代表人工业务语义层的效果。

semantic 默认 20 个工具动作（包含发现与编译），loop 保持 12 步，可用 `--max-steps` 修改。当前运行记录使用 `semanticProtocol: smq-v4`、显式文件版本 `file-v3`；历史报告不变，续跑不得跨实现版本混合。semantic 使用 AI SDK `ToolLoopAgent` 和原生工具消息，模型端点必须支持 tool calling；最后一轮允许 `execute` 或 `cannotAnswer`。模型先发现元素，再编译 SMQ 并预览结果，最后组合 SQL；最终表、列引用由 DuckDB 原生解析树校验，缺少来源证据时继续探索。发现必要信息缺失时可以明确结束，API 抛出带原因的 `InsufficientInformationError`，评测记录为失败，不伪造空答案。不直接接收完整 schema/profile。BIRD 的 evidence、Spider2-Lite 的 external knowledge 仍按原方式传入；BIRD 若启用 `--database-description`，仍会提供原字段说明。

DataBench 支持 `--ids-file <path>`，文件为非空、无重复的题目 ID JSON 数组；通常与 `--limit all` 一起使用。缺失 ID 会在模型调用前报错，选中 ID、数据和实现哈希写入 manifest。单列和标量/列表要求只在评测提示及适配器中处理，不进入 semantic 核心 API。适配器拒绝多列、嵌套数组、标量多行和不完整结果，不再静默展开或截取答案，也不通过改写 SQL 使结果通过校验。semantic 的工具输入及执行前 SQL 校验错误可在总步数内修正；实际执行开始后，成功或失败均结束流程。`--max-retries` 仅用于 direct 策略。

用 Forbes full 数据运行显式语义配置：

```bash
node evals/cli.js run ava-workflow --benchmark databench \
  --dataset databench --suite 001_Forbes --limit all --strategy semantic --max-steps 20 \
  --engine duckdb --concurrency 1 \
  --output evals/ava-workflow/results/forbes-full-semantic.csv
```

三个评测器均支持 semantic。BIRD 的 `--check --strategy semantic` 加载显式配置，Spider2-Lite 则生成 schema 配置，均不调用模型。比较 direct、loop、semantic 时应固定模型、题目、数据及字段说明开关，分别使用新输出路径，并同时报告准确率、失败率、耗时和 token 用量。

### Spider2-Lite 评测器

仅评测 SQLite 子集，使用 DuckDB 执行分析。先检查数据库加载、画像及评分依赖，再运行评测；`--check` 不调用模型。

```bash
node evals/cli.js run ava-workflow --benchmark spider2lite --check --limit all

export SPIDER2LITE_OUTPUT="evals/ava-workflow/results/spider2lite-$(date +%Y%m%d-%H%M%S)"
node evals/cli.js run ava-workflow --benchmark spider2lite --limit all --concurrency 3 --output "$SPIDER2LITE_OUTPUT"
```

### BIRD 评测器

使用 DuckDB 分析 SQLite 数据库。普通策略模型输入为 AVA 数据画像、问题和官方 `evidence`；semantic 使用上述显式 YAML 工具，不直接提供完整 schema/profile。运行时不直接传入参考 SQL，官方表描述仅在开启对应参数时额外加入。

```bash
node evals/cli.js run ava-workflow --benchmark bird --check --limit all

export BIRD_OUTPUT="evals/ava-workflow/results/bird-$(date +%Y%m%d-%H%M%S)"
node evals/cli.js run ava-workflow --benchmark bird --limit all --concurrency 4 --output "$BIRD_OUTPUT"
```

Spider2-Lite 和 BIRD 默认并发 1，可用 `--suite` 或 `--id` 筛选题目。查询默认超时 30 秒、单题评分超时 60 秒；Spider2-Lite 结果上限为 10,000 行，BIRD 为 1,000,000 行，两者均限制 64 MiB，截断视为失败。BIRD 每个 workflow 默认内存上限 2 GB，可用 `--memory-limit` 调整。

BIRD 可加 `--database-description`，将所选数据库 `database_description/` 下的 CSV 字段说明加入模型上下文；默认不加入。说明文件的哈希会记录在 manifest 中。对比实验请使用新的结果目录。

## 中断后续跑

**DataBench**：重新执行原命令，复用同一 CSV。校验配套 manifest 的模型、策略预算、选题、数据和实现哈希后，跳过已有非空答案（包括答错的题目），重试无答案题目。更换模型、策略或题目范围时使用新文件；旧 CSV 缺少 manifest 时只能离线评分。

**Spider2-Lite / BIRD**：指定原结果目录和 `--resume`，校验运行配置、实现版本及成功结果文件，跳过成功记录，重试失败和未完成题目，最后重新评分。允许扩充题目和调整并发，不允许缩小原选题范围；BIRD 还会校验数据哈希。

```bash
node evals/cli.js run ava-workflow --benchmark spider2lite --resume --limit all --concurrency 3 --output "$SPIDER2LITE_OUTPUT"
node evals/cli.js run ava-workflow --benchmark bird --resume --limit all --concurrency 4 --output "$BIRD_OUTPUT"
```

这里的变量须指向原目录，重新打开终端后需重新赋值。BIRD 首次运行要求新目录或空目录；Spider2-Lite 也保留复用目录自动续跑的行为。若强制终止后遗留 `.run.lock`，确认原进程退出再删除。

## 结果与评分

DataBench 的 CSV 保存答案、SQL、错误、耗时和 token 用量；`results/` 中每次评测只生成一个预测 CSV。manifest、语义配置、逐题记录和报告位于 `evals/ava-workflow/.runs/<CSV文件名>-<输出路径哈希>/`，启动时打印实际路径；其中 `report.json` 只评分本次选题，`records/` 保存单题工具动作和查询诊断。Spider2-Lite / BIRD 使用结果目录：`manifest.json` 保存运行配置，`sql/` 保存 SQL，`exec_result/` 保存实际结果（分别为 CSV / JSON），`records/` 保存单题记录，`report.json` 汇总准确率。

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

semantic 额外保存所用配置快照：DataBench 为对应 `.runs/` 目录中的 `semantic.json`，BIRD / Spider2-Lite 为结果目录中的 `semantic.json`。manifest 记录生成规则版本、配置内容哈希和实际 `lib/` 实现哈希；单题记录含语义配置哈希。配置或实现变化时须新建输出路径。工具轨迹只记录动作、SQL 和诊断，不保存模型推理文本或预览结果行。升级到此版本前的旧 manifest 不能继续混跑，可离线评分。
