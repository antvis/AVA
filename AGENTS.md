# 项目开发规范

## 项目目录

```text
AVA/
├── src/
│   ├── ava.ts                   # 对外 API 与工作流编排
│   ├── types.ts                 # 模块接口与共享类型
│   ├── engines.ts               # 引擎注册
│   ├── analysis/                # 分析策略
│   ├── query/                   # SQL 生成与校验
│   ├── duckdb/                  # DuckDB 引擎与数据源接入
│   ├── remote/                  # 远端数据库引擎
│   ├── interpreter/             # JavaScript 与 Python 执行引擎
│   ├── visualization/           # 图表推荐与生成
│   ├── cli/                     # 命令行与会话管理
│   └── util/                    # 共享工具
├── __tests__/                   # 单元与集成测试
├── evals/                       # 分析与 Agent 能力评测
├── site/                        # 官网与文档
└── skills/ava/                  # AVA Agent skill
```

## 模块职责

| 模块 | 职责 |
| --- | --- |
| 数据源 | 数据接入 |
| 引擎 | 选择 SQL 方言，管理连接、数据加载、查询执行及数据库只读权限 |
| 方言 | SQL 生成、解析与只读校验 |

## 方言规范

- 文件组织：按 SQL 语言命名，平铺在 `src/query`；一个方言对应一个文件和一个实现 `QueryDialect` 的类。
- 实现依据：生成与校验遵循对应方言和解析器的官方文档，注释标明依据。
- `getDSL(query, dataModel)`
  - 根据问题与数据模型生成单条只读 SELECT，返回纯 SQL 及模型 usage。
- `validateDSL(sql)`
  - 仅接收 SQL 文本，本地解析器在首次校验时按需加载。
  - 通过 AST 校验单条只读 SELECT，覆盖 CTE、子查询、集合运算及执行配置、输出子句。
  - 输出保留 SQL 语义，并适配 engine 的限行查询包装。
  - 校验测试使用真实解析器，只保留核心验证逻辑。
