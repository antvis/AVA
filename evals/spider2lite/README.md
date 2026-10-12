# Spider 2.0-Lite

[Spider 2.0-Lite](https://github.com/xlang-ai/Spider2/tree/main/spider2-lite) 是面向真实企业场景的 Text-to-SQL 基准，要求结合自然语言问题、数据库结构与外部知识生成 SQL，涵盖 SQLite、BigQuery 和 Snowflake。

已核验版本包含 **547 道题**，其中 **135 道 `local*` 题目**使用 **30 个 SQLite 数据库**。本地 SQLite 只是子集，不能代表完整基准；数据规模可能随上游更新。

## 下载数据

### 1. 获取题目与资源

需要 Node.js 22.13+ 和支持 sparse-checkout 的 `git`，无需额外 npm 依赖。在仓库根目录执行：

```bash
node evals/spider2lite/fetch.js
```

脚本仅从官方仓库 `main` 分支下载题目、完整 `resource/` 和 `evaluation_suite/gold/`，不下载或解压 SQLite 数据库。

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
└── evaluation_suite/gold/
    ├── spider2lite_eval.jsonl         # 评分元数据，文件名没有连字符
    ├── exec_result/                  # 参考执行结果
    └── sql/                          # 参考 SQL（上游提供时下载）
```

题目字段为 `instance_id`（题目 ID）、`db`（数据库）、`question`（问题）和 `external_knowledge`（外部知识文件引用）。数据库描述与外部知识属于解题输入；gold 用于评分，不应提供给模型。

## 下载行为与评测边界

- 脚本下载并校验题目与评分元数据后，才复制到本目录；不校验手动放置的 SQLite 文件，也不执行 SQL。
- 重复下载覆盖同名文件，不清理上游已删除的旧文件。成功后输出 Git commit，便于记录版本；独立下载的 SQLite ZIP 不受该 commit 固定。
- `resource/`、`evaluation_suite/gold/` 和根目录 JSONL 均被 Git 忽略，仅提交脚本与说明。
- BigQuery、Snowflake 数据不包含在 SQLite ZIP 中，需按官方 [BigQuery 指南](https://github.com/xlang-ai/Spider2/blob/main/assets/Bigquery_Guideline.md)和 [Snowflake 指南](https://github.com/xlang-ai/Spider2/blob/main/assets/Snowflake_Guideline.md)配置访问权限，查询可能产生费用。
- 官方评分器为 Python，参见[评测说明](https://github.com/xlang-ai/Spider2/tree/main/spider2-lite/evaluation_suite)。本脚本只准备数据，不下载该评分程序，也不运行 AVA 评测；不能仅凭 gold CSV 数量判断题目覆盖率。
