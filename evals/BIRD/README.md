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
