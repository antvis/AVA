# BIRD

[BIRD](https://bird-bench.github.io/) 是面向真实数据库的 Text-to-SQL 基准，要求结合自然语言问题、数据库结构和外部知识生成 SQL。本目录使用官方开发集 `dev_20240627`，共 **1,534 道题、11 个 SQLite 数据库**，覆盖金融、教育、体育、医疗等领域。

## 数据库概览

以下为 `dev_20240627` 的本地统计，总行数为各表行数之和；主要特点用于理解数据，不代表官方难度评级。

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

脚本从官方下载约 330 MiB 的压缩包，校验并解压到 `evals/BIRD/datasets/dev/`，建议预留 4 GiB 空间。重复下载会覆盖同名文件；数据目录已被 Git 忽略。

## 数据内容

- `dev.json`：问题、外部知识（`evidence`）、参考 SQL 和难度标签。
- `dev_tables.json`：数据库结构；`dev.sql`：参考 SQL。
- `dev_databases/<db_id>/`：SQLite 数据库及 `database_description/` 字段说明。

使用该数据集运行 AVA 评测，见 [Workflow BIRD 评测器](../ava-workflow/README.md#bird-评测器)。
