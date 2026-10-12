# BIRD

[BIRD](https://bird-bench.github.io/) 是面向真实数据库的 Text-to-SQL 基准，要求结合自然语言问题、数据库结构和外部知识生成 SQL。本目录下载官方开发集 `dev_20240627`，包含 **1,534 道题目和 11 个 SQLite 数据库**。

## 下载数据

需要 Node.js 22.13+、`curl`（支持 `--retry-all-errors`）和 `unzip`，无需额外 npm 依赖。在仓库根目录执行：

```bash
node evals/BIRD/fetch.js
```

脚本从[官方地址](https://bird-bench.oss-cn-beijing.aliyuncs.com/dev.zip)下载约 330 MiB 的压缩包，校验并解开外层数据包和内层数据库包，将上游版本目录统一为 `datasets/dev/`。下载与解压期间建议预留至少 4 GiB 空间。

```text
evals/BIRD/
├── fetch.js
├── README.md
└── datasets/dev/
    ├── dev.json                  # 问题、外部知识及参考 SQL
    ├── dev.sql                   # 参考 SQL
    ├── dev_tables.json           # 数据库结构
    ├── dev_tied_append.json      # 上游补充参考信息
    └── dev_databases/
        └── <db_id>/
            ├── <db_id>.sqlite
            └── database_description/
```

下载和压缩包校验在临时目录完成；确认题目数量、数据库文件及对应结构存在后，才复制到目标目录。重复运行会重新下载并覆盖同名文件，保留其他本地文件。临时压缩包自动清理，`datasets/` 已被 Git 忽略。

## 数据库清单

以下为 `dev_20240627` 的本地统计，总行数为各表行数之和。主要难点来自结构和业务语义分析，不代表官方难度评级。

| 数据库 | 领域 | 表数 / 字段总数 | 总行数 | 大小（MiB） | 主要难点 |
| --- | --- | ---: | ---: | ---: | --- |
| `california_schools` | 加州学校 | 3 / 89 | 29,941 | 10.6 | 宽表、成绩与招生比例指标 |
| `card_games` | 卡牌游戏 | 6 / 115 | 803,445 | 249.7 | 74 字段主表，版本、规则与多语言信息 |
| `codebase_community` | 技术问答社区 | 8 / 71 | 740,646 | 459.1 | 用户、帖子、评论、投票与历史记录关联 |
| `debit_card_specializing` | 加油卡消费 | 5 / 21 | 423,050 | 33.0 | 交易与月度统计口径 |
| `european_football_2` | 欧洲足球 | 7 / 199 | 222,796 | 570.1 | 115 字段比赛表，主客队、球员与历史属性关联 |
| `financial` | 银行业务 | 8 / 55 | 1,079,680 | 68.0 | 客户、账户与贷款关联，百万行交易表 |
| `formula_1` | F1 赛车 | 13 / 94 | 514,287 | 21.3 | 车手、车队、赛事、圈速与排名的多表关联 |
| `student_club` | 学生社团 | 8 / 48 | 42,511 | 2.5 | 成员、活动、出勤与收支关联；多数行来自邮编表 |
| `superhero` | 超级英雄 | 10 / 31 | 10,614 | 0.2 | 属性与能力的多对多关系 |
| `thrombosis_prediction` | 血栓预测 | 3 / 64 | 15,952 | 7.0 | 医疗缩写、检验指标与条件理解 |
| `toxicology` | 分子毒理学 | 4 / 11 | 49,813 | 2.6 | 原子、化学键与连接关系的图结构 |

## 运行 AVA Workflow 评测

需要 Node.js **22.18+** 和带有 `sqlite3` 标准库的 Python 3，无额外 Python 依赖。模型使用 `evals/ava-workflow/.env` 或已有环境变量中的 `OPENAI_API_KEY`、`OPENAI_MODEL`、`OPENAI_BASE_URL`；请求固定携带 `chat_template_kwargs.enable_thinking: false`，与其他 workflow 评测一致，服务端需支持该参数。

```bash
npm run build

# 检查全部数据库能否加载和生成画像，不调用模型
node evals/cli.js run ava-workflow --benchmark bird --check --limit all

# 先跑 3 道题
node evals/cli.js run ava-workflow --benchmark bird --limit 3 \
  --output evals/ava-workflow/results/bird-smoke

# 全量开发集
node evals/cli.js run ava-workflow --benchmark bird --limit all --concurrency 3 \
  --output evals/ava-workflow/results/bird-full

# 离线重评已有结果，不调用模型
node evals/cli.js score --dataset bird \
  --predictions evals/ava-workflow/results/bird-smoke
```

默认 `direct` 策略、20 题、并发 1。支持 `--strategy direct|loop|subset`、`--suite <数据库名>`、`--id <question_id>`（可重复，支持 ID 0）、`--offset` 和 `--limit`。其他参数见 `--help`。每次运行使用新的或空的输出目录，不支持断点续跑，避免混用不同条件的答案。

每道题执行 `source → profile → analyze`，使用 DuckDB 只读加载 SQLite 数据库。模型输入为 AVA 数据画像、原始问题和官方 `evidence`；不提供参考 SQL 或官方表描述。输出目录包含：

- `manifest.json`：题目 ID、模型、关闭思考的请求参数、运行配置、数据与适配器哈希。
- `sql/<id>.sql`、`exec_result/<id>.json`：最终 SQL 与 AVA 实际返回的有类型、按列排列的结果。
- `records/<id>.json`、`report.json`：单题耗时、token 用量、失败原因，以及总体、各难度和各数据库准确率。

## 评分口径

采用 [BIRD 官方 EX 的行集合比较规则](https://github.com/AlibabaResearch/DAMO-ConvAI/blob/main/bird/llm/src/evaluation.py)：忽略行顺序和重复行，保留列顺序，数值比较不加误差容忍。根据结果字段类型还原 DuckDB 序列化为字符串的数值；文本字段不转换。

本适配器比较 **AVA 在 DuckDB 上的实际结果**与**参考 SQL 在原始 SQLite 上的结果**，不重跑模型 SQL。因此报告标记为 `ava-result-vs-sqlite-gold`，不等同于官方将两份 SQL 都在 SQLite 执行的 EX，也不计算效率指标 VES/R-VES。

每个 workflow 的 DuckDB 内存上限默认 2 GB，可用 `--memory-limit` 调整（欧洲足球库的画像会超过 512 MB）。查询默认超时 30 秒，单题评分默认超时 60 秒。AVA 结果最多 10,000 行、64 MiB，截断则记为失败；失败、缺失和评分错误均计零，保留在所选题目的分母中，并返回非零退出码。单纯答案不匹配不影响退出码。离线重评沿用运行清单中的题目，并校验数据哈希。
