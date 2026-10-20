# BIRD 显式语义配置

这 11 份 YAML 用于本地 BIRD New Dev `dev_20251106`（1,534 题）的 semantic 评测。配置依据真实 SQLite 数据库、官方 `database_description/*.csv`、逐库抽查的 golden SQL 和题目 evidence 编写；所有 golden SQL 都经 SQLite 解析并提取了实际表/列读取依赖。它们是**参考答案知情的人工整理配置，不是盲测或仅 schema 自动生成基线**。

`provenance.json` 记录数据库、题目和字段说明的哈希、逐库阅读的 golden question ID、全部 golden SQL 的字段依赖，以及聚合和连接依据。YAML 不含逐题答案、完整 golden SQL 或固定题目的筛选答案；模型运行时接收问题、evidence 和语义工具，golden SQL 仅用于离线评分。

## 建模口径

- 覆盖 75 张物理表、798 个源字段；保留源字段和原始编码。ID、分类编码和标志不自动作为可加总数量。
- 属性、行级量和聚合分别放在 dimensions、measures、metrics。简单聚合取自 golden SQL 中能明确绑定到物理列的表达式；没有为每个数值字段批量增加所有聚合。
- 每个模型说明行粒度。按记录选 top-N 时保留主键；跨表连接可能放大记录，distinct 实体数和连接后的行数不可混用。
- 连接来自 SQLite 外键，或有明确 golden SQL 依据的键（例如 cards.setCode → sets.code、transactions_1k 的字典表连接）。重复声明的外键去重；隐式目标键解析到主键。
- 同一目标表的不同连接角色使用独立逻辑模型，例如眼睛/头发/皮肤颜色、主队/客队、作者/编辑者、两个原子端点。角色模型仍指向原表，不复制或改写数据。
- 已定义的少量派生量包括学校免费餐比例、SAT 达标率、计划还款及利息、圈速秒数。各自保留分母、单位和 NULL 口径。没有把整道题的 SQL 嵌入模型。

## 已知冲突和限制

- financial 的不同 New Dev 题目对贷款状态 A/B/C/D 的解释互相冲突。保留官方字段说明和原始码；题目显式 evidence 只在该题中解释，不覆盖全库定义。
- debit_card_specializing 的官方说明有 Amount × Price，而多道 golden SQL 直接对 Price 求和/均值。两种量不能静默替代。
- 医疗数据库中的“正常范围”是数据集说明，并且部分题目阈值与之不一致；没有固化通用的正常/异常公式，也不将其作为临床建议。
- 一些 golden SQL 存在连接后重复计数、未充分指定并列排序或题意差异。语义层不包含按标答硬编码的结果，也不保证解决这些评分差异。
- 足球库 Team.team_fifa_api_id 存在 3 组重复非空键，每组 2 行；对应连接会放大属性记录。team_api_id 为不同连接键，不应混用。
- 多条连接路径仍需按问题选择正确角色；跨事实表汇总应先在所需粒度聚合。评分保留现有 BIRD 比较器：DuckDB 实际结果与 SQLite gold 的精确行集合比较，保留列顺序，忽略行顺序和重复行；不等同于官方 SQLite EX/VES。

## 加载与验证

BIRD 的 `--strategy semantic` 固定读取本目录 `<db_id>.yaml`，文件缺失或无效即失败，不回退到 schema 生成。Spider2-Lite 继续使用 schema 基线，DataBench 继续使用其原目录。

运行前已对 11 个数据库逐一加载，编译并执行所有字段、聚合、派生表达式和声明连接。验证证据位于本次运行支持目录 `evals/ava-workflow/.runs/bird-semantic-20261019/validation.json`。配置文件字节哈希、配置快照和运行时实现哈希另存于评测 manifest/semantic.json。
