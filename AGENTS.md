# 项目开发规范

## 新增数据源：先选执行位置

先读 `src/types.ts` 中的源、引擎、方言接口，再沿所选路径读一份实现及测试。接入方式由查询执行位置和语言决定，不按服务名称机械新增引擎。

| 接入方式 | 实现位置 | 查询语言 | 参考实现 |
| --- | --- | --- | --- |
| 文件、内联数据或 API 数据导入本地 | `src/duckdb/loaders/` | DuckDB SQL | `csv-file.ts`、`feishu-bitable.ts` |
| 通过 DuckDB 扩展连接数据库 | `src/duckdb/loaders/` | DuckDB SQL，非源数据库方言 | `postgresql.ts` |
| 驱动或 API 在远端执行 SQL | `src/remote/<source>/` | 远端方言，优先复用已有实现 | `sqlserver/`、`supabase/` |

已有解释器的数据加载能力在 `src/interpreter/` 对应语言中扩展。源配置沿用 `{ type, options }`，数据源类型与引擎类型分别表达接入对象和执行方式。

## 设计约束

- **职责分层**：loader 负责接入；引擎管理连接、加载、执行与数据库只读权限；查询语言类负责生成和解析校验。`src/ava.ts` 只编排公共工作流与生命周期，不直接导入引擎实现或添加源专属分支。
- **按执行语言选方言**：通过 DuckDB 接入的数据库复用 DuckDB 方言。内置引擎统一暴露只读 `dialect`，语言标识与执行绑定读取其 `id`、`rules`。语言信息由引擎提供，不在调用方重复维护。
- **只读双重约束**：所有外部 SQL，包括直接 `query`，执行前必须经过方言 AST 校验；同时落实数据库只读角色、连接或请求设置。不能用提示词或语句前缀判断代替校验。
- **沿用执行边界**：保留 DuckDB 的访问限制；远端查询在服务端限行，适配目标方言，并复用 `src/util/result.ts` 的结果限制与截断语义。超时、取消和资源清理由引擎负责，加载失败也必须清理。
- **结构、统计、语义分开**：schema 保留源端可获得的原生类型、约束和关系，不扫描全表计算统计或推断业务语义；profile 是可选能力，沿用统一指标协议。区分逻辑模型名与物理表引用，避免跨 schema 同名冲突，保持组合键配对。
- **运行环境隔离**：引擎通过入口注册；Node 专属驱动不能进入浏览器运行时依赖链。交互式认证与凭据保存放在 CLI，loader/引擎保持可编程调用，凭据不进入仓库、日志或错误文本。
- **复用现有实现**：优先使用已有 loader、文件、目录组装和 SQL 工具；转义遵循目标方言。依照数据库、驱动、扩展及解析器的官方文档实现，关键限制注明依据；不为单个数据源增加通用框架。

## 方言规范

- 按查询语言命名，平铺在 `src/query/`，一个文件对应一个 `QueryDialect` 实现；SQL 方言 `id` 以 `sql` 结尾，解释器使用 `python`、`javascript`。
- 语法规则与执行绑定内联在只读 `rules` 字段，模型响应格式要求留在 `getDSL`；生成、解析和校验集中在同一文件。
- SQL 生成和校验以单条只读 SELECT 为边界；AST 校验覆盖嵌套查询、集合运算及带副作用的配置/输出子句，保留 SQL 语义并适配引擎限行方式。
- Python/JavaScript 校验语法，保留原文、注释和缩进，执行隔离与资源限制由引擎负责。解析器按需加载，校验测试使用真实解析器。

## 接入导航

按实际影响检查以下位置，接口字段与方法细节以代码为准：

| 位置 | 检查内容 |
| --- | --- |
| `src/types.ts` | 数据源配置、引擎配置与公共契约 |
| `src/duckdb/loaders/index.ts` | loader 分发；远端源误用 DuckDB 时明确报错 |
| `src/remote/index.ts`、`src/index.ts`、`src/index.browser.ts` | 引擎导出、注册与环境边界 |
| `src/cli/session/protocol.ts`、`datasets.ts` | 运行时配置校验、默认引擎选择与语言信息 |
| `src/cli/commands/source.ts` | 按需补充文件/URL 识别、帮助与示例 |
| `skills/ava/references/sources.md`、`site/content/docs/{zh,en}/data/sources.mdx` | 配置、引擎、语言、认证与限制；改官网前读取 `site/AGENTS.md` |

注意：SDK 默认使用 DuckDB，CLI 会为部分远端源自动选择引擎，新增源需分别检查；CLI 的配置校验不能代替 SDK 路径必要的校验。

## 验证

- 在 `__tests__/` 补充对应测试，重点验证公共链路 `source → schema → query → dispose`、只读与结果限制、失败清理及源特有边界；基础接入测试不依赖模型。真实服务 fixture 放在 `__tests__/datasets/`，写明启用方式。
- 运行针对性测试、`npx tsc --noEmit` 和 `npm run lint`；涉及入口、依赖或打包时运行 `npm run build`。测试构建后的 CLI 前先运行 `npm run build:cjs`。
- 交付时区分已通过、跳过和未验证项。
