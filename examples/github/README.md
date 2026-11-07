# GitHub：Issue 积压与 PR 合并耗时

用 AVA 分析一个 GitHub 仓库的研发协作数据：还有多少 issue 没人处理，PR 从提交到合并要多久。连接器通过 [GitHub REST API](https://docs.github.com/rest/issues/issues#list-repository-issues) 只读读取一个仓库的 issue 和 PR，载入 DuckDB 的 `issues`、`pull_requests` 两张表，然后用自然语言提问。只调用列出 issue 的接口，不写回，也不读取正文、review、commit 等其他对象。

## 授权与配置

公开仓库不需要 token，但匿名请求按 IP 共享每小时 60 次；带 token 时每小时 5,000 次，并能读取 token 有权访问的私有仓库。私有仓库请为该仓库创建只读 **Issues**、**Pull requests** 权限的 [fine-grained token](https://github.com/settings/personal-access-tokens/new)；classic token 读公开仓库无需 scope，读私有仓库需要 `repo`。组织启用 SAML 单点登录时，还需为该组织授权 token。

token 通过 `options.token` 显式传入，loader 不读取环境变量。CLI 依次读取 `GH_TOKEN`、`GITHUB_TOKEN`（与 GitHub CLI 相同，可用 `GH_TOKEN=$(gh auth token)`）。不要把 token 写进仓库或日志。

Node.js 要求 22.13+，安装后构建：

    npm install
    npm run build

## SDK 与 CLI

    import { AVA } from '@antv/ava';
    const ava = new AVA({ llm: {
      model: process.env.OPENAI_MODEL,
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    } });
    try {
      await ava.source({ type: 'github', options: { repository: 'antvis/AVA', token: process.env.GH_TOKEN } });
      console.log(await ava.analyze('当前未关闭的 issue 有多少个没有负责人？'));
    } finally { await ava.dispose(); }

CLI 自动识别仓库链接（包括其 `/issues`、`/pulls` 页面）；`owner/name` 需配合 `--type github`；`since` 和上限用配置文件传入，见 [source.json](./source.json)：

    node lib/cli/index.js source https://github.com/antvis/AVA
    node lib/cli/index.js source @examples/github/source.json
    node lib/cli/index.js analyze <datasetId> "2026 年 10 月合并的 PR 从创建到合并的中位时长是多少小时？"
    node lib/cli/index.js dispose <datasetId>

加载、schema 和直接 SQL 不调用模型。CLI 会话要求 Linux/macOS，Windows 请使用 SDK 或 WSL。

## 表与字段语义

| 表 | 列 |
| --- | --- |
| `issues` | `number`（主键）、`title`、`state`、`state_reason`、`author`、`author_association`、`author_is_bot`、`assignees`、`labels`、`comments`、`created_at`、`updated_at`、`closed_at`、`html_url` |
| `pull_requests` | 同上，但没有 `state_reason`，另有 `is_draft`、`is_merged`、`merged_at` |

- GitHub 的列表接口把 PR 也当作 issue 返回，带 `pull_request` 字段的条目进入 `pull_requests`，其余进入 `issues`，避免统计 issue 时混入 PR。
- 与 GitHub 网页和搜索 `is:closed` 一致，已合并的 PR `state` 为 `closed`，用 `is_merged` 区分合并与关闭未合并。
- `state`、`state_reason`、`author_association` 是 GitHub 文档取值加上实际返回取值构成的 `ENUM`，`ava schema` 直接列出可用取值。
- 时间统一为 UTC 的 `TIMESTAMP`，与 GitHub 搜索限定词（如 `merged:2026-10-01..2026-10-31`）时区一致，按月统计不随机器时区变化。
- `assignees`、`labels` 为 `VARCHAR[]`；`comments` 为对话评论数；机器人作者的 `author_is_bot` 为 true。
- 编号、状态、创建或更新时间缺失或非法的条目会使整次加载失败，不返回部分数据。

## 可靠性与访问限制

| 选项 | 默认 | 范围 |
| --- | --- | --- |
| since | 无 | ISO 8601 日期或时间，不带时区按 UTC；所有未关闭的条目照常读取，已关闭的只读此后有更新的。 |
| maxRecords | 10,000 | 1–100,000 个 issue 和 PR，超限失败，不截断。 |
| timeoutMs | 60,000 | 1–110,000 毫秒，覆盖整次加载、重试和限流等待。 |

每次请求 100 条，沿 `Link` 头翻页，翻页链接必须仍在 `api.github.com`。主限流（`x-ratelimit-remaining: 0`）等到重置时间；次级限流按 `retry-after`，没有时等 1 分钟；等待会超过 `timeoutMs` 时立即失败并给出重置时间。网络错误、响应读到一半断开和 5xx 按 1、2、4 秒重试三次。401、403（含 SAML 单点登录授权链接）、404 等错误保留 GitHub 原始信息并给出处理提示，不重试，也不输出 token。行数据以 JSON 参数绑定直接写入内存表，不写临时文件。

同一仓库加载期间若有 issue 被关闭，以后读到的状态为准；这不是远端的事务快照。

## 两个业务示例与验证

[analyze.mjs](./analyze.mjs) 加载仓库后，先用直接 SQL 计算两个业务指标，再在运行时用 GitHub 搜索独立计算同一指标并逐项断言；不带 `--verify-only` 时，再让模型回答对应的自然语言问题，并断言模型结果与 SQL 结果一致。积压数字随时间变化，每次运行都与当时的搜索结果比较；10 月的合并统计属于已结束的月份，结果固定。

    node examples/github/analyze.mjs antvis/AVA --verify-only
    GH_TOKEN=<只读 token> OPENAI_API_KEY=<key> OPENAI_MODEL=<model> OPENAI_BASE_URL=<可选> node examples/github/analyze.mjs antvis/AVA

| 问题 | 核对方式 | antvis/AVA，2026-11-08 |
| --- | --- | --- |
| 当前未关闭的 issue 有多少个？其中没有任何标签的、没有负责人的各有多少个？ | 搜索 `is:issue is:open`、`no:label`、`no:assignee` 的计数 | 13 个，无标签 4 个，无负责人 13 个 |
| 2026 年 10 月合并了多少个 PR？从创建到合并的时长中位数是多少小时？ | 搜索 `is:pr merged:2026-10-01..2026-10-31` 的结果，独立计算中位数 | 36 个，中位 1.25 小时 |

## 测试

    npm run lint
    npm run build
    npm test
    npx vitest run __tests__/duckdb/loaders/github.test.ts

GitHub 相关测试集中在 `__tests__/duckdb/loaders/github.test.ts`：只模拟 HTTP，经过正式的客户端、转换、loader 和真实 DuckDB，覆盖配置校验、分页、限流与重试、整体期限、错误提示、两个业务场景的 SQL 结果和 CLI，不需要 token 或网络。真实数据复验使用上文的 `analyze.mjs`。

## 已知限制

- 每个 source 只加载一个仓库；不读取正文、评论内容、review、commit、GitHub Projects 和 Discussions。
- 合并耗时从 PR 创建算起；草稿转为待审的时间需要 timeline 接口，首版不包含。
- GitHub 搜索的 `author:` 会把 Copilot 编码代理代某人创建的 PR 也算给这个人，而接口和 PR 页面显示的作者是 `Copilot`，所以按作者的统计以表中数据为准。
- 仓库 star 历史需要仓库管理员权限才能读取，不在范围内。
