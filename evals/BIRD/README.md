# BIRD

[BIRD](https://bird-bench.github.io/) 是面向真实数据库的 Text-to-SQL 基准，要求结合自然语言问题、数据库结构和外部知识生成 SQL。本目录使用官方 New Dev 开发集 [`dev_20251106`](https://huggingface.co/datasets/birdsql/bird_sql_dev_20251106)，共 **1,534 道题、11 个 SQLite 数据库**，覆盖金融、教育、体育、医疗等领域。

## 数据库概览

New Dev 复用原有数据库，以下为共用数据库的本地统计，总行数为各表行数之和；主要特点用于理解数据，不代表官方难度评级。

| 数据库 | 领域 | 表数 / 字段数 | 总行数 | 大小（MiB） | 主要特点 |
| --- | --- | ---: | ---: | ---: | --- |
| `california_schools` | 加州学校 | 3 / 89 | 29,941 | 10.6 | 宽表、成绩与招生比例 |
| `card_games` | 卡牌游戏 | 6 / 115 | 803,445 | 249.7 | 版本、规则与多语言信息 |
| `codebase_community` | 技术问答社区 | 8 / 71 | 740,646 | 459.1 | 用户、帖子、评论与投票关联 |
| `debit_card_specializing` | 加油卡消费 | 5 / 21 | 423,050 | 33.0 | 交易与月度统计 |
| `european_football_2` | 欧洲足球 | 7 / 199 | 222,796 | 570.1 | 宽表、主客队与球员历史属性 |
| `financial` | 银行业务 | 8 / 55 | 1,079,680 | 68.0 | 客户、账户、贷款与百万行交易表 |
| `formula_1` | F1 赛车 | 13 / 94 | 514,287 | 21.3 | 车手、赛事、圈速与排名关联 |
| `student_club` | 学生社团 | 8 / 48 | 42,511 | 2.5 | 成员、活动与收支；多数行来自邮编表 |
| `superhero` | 超级英雄 | 10 / 31 | 10,614 | 0.2 | 属性与能力的多对多关系 |
| `thrombosis_prediction` | 血栓预测 | 3 / 64 | 15,952 | 7.0 | 医疗缩写与检验指标 |
| `toxicology` | 分子毒理学 | 4 / 11 | 49,813 | 2.6 | 原子与化学键的图结构 |

## 下载数据

需要 Node.js **22.13+**、`curl`（支持 `--retry-all-errors`）和 `unzip`。在仓库根目录执行：

```bash
node evals/BIRD/fetch.js
```

脚本从官方 Hugging Face 下载 New Dev 题目（约 947 kB），校验 SHA-256、1,534 个唯一题目及 11 个数据库。已有数据库直接复用；首次安装额外下载约 330 MiB 数据库压缩包，建议预留 4 GiB 空间。仅从压缩包提取共用数据库，不导入旧版题目。

数据安装到 `evals/BIRD/datasets/dev/`。校验成功后原子替换 `dev.json`，删除旧版 SQL、补充题目和不再使用的表结构 JSON；schema 从数据库读取。数据目录已被 Git 忽略。旧结果与新版题目不可混用，续跑及离线评分会通过资源哈希拒绝跨版本使用。

评分所用 Python 的 `sqlite3` 需为 **SQLite 3.39+**：新版第 196 题使用无 `GROUP BY` 的聚合 `HAVING`（[SQLite 3.39 发布说明](https://www.sqlite.org/releaselog/3_39_0.html)）。用 `python3 -c "import sqlite3; print(sqlite3.sqlite_version)"` 检查；Workflow、Agent 和离线评分默认优先使用 `evals/BIRD/.venv/bin/python3`，没有专用环境时使用 `python3`；也可通过 `--python` 显式指定。评分器会拒绝 SQLite 3.39 以下版本。

用已确认附带 SQLite 3.39+ 的 Python 创建专用环境（无需安装第三方包）：

```bash
/path/to/compatible/python3 -m venv evals/BIRD/.venv
evals/BIRD/.venv/bin/python3 -c "import sqlite3; print(sqlite3.sqlite_version)"
```

## 数据内容

- `dev.json`：问题、外部知识（`evidence`）、参考 SQL 和难度标签。
- `dataset.json`：New Dev 版本、官方来源及下载文件哈希。
- `dev_databases/<db_id>/`：SQLite 数据库及 `database_description/` 字段说明。

使用该数据集运行 AVA 评测，见 [Workflow BIRD 评测器](../ava-workflow/README.md#bird-评测器)。

## 本地语义文件

Workflow 可读取本目录 `semantics/<db_id>.yaml`，复用 SDK 的 `Semantic` 结构。语义文件由使用者自行准备，保留在本地，不随仓库提交，下载器也不提供；文件不存在时沿用 schema/profile 流程。`--no-semantic` 可显式关闭加载，`--database-description` 可同时使用。

定义只描述可复用的实体、字段、关系和指标，不包含逐题答案。若使用题目或 gold 校准定义，须在报告中注明属于样本内调优，并与无语义基线分开解释。

语义文件在调用模型前校验，实际加载文件的哈希保存在运行 manifest 中，用于续跑及离线评分校验；report 只保留评测配置、成绩、用量和必要的来源说明。定义变化后须使用新的输出目录。
