# 腾讯文档智能表格：原生 OpenAPI

将显式授权的单个智能子表通过 AVA loader → DuckDB 进行只读分析。适用于销售订单、项目跟踪和运营报表。连接器只调用 getFields/getRecords，不使用 MCP SDK，不扫描私人文件、不写回或同步。

## 授权与配置迁移

依照腾讯文档[应用接入](https://docs.qq.com/open/document/app/get_started.html)、[OAuth](https://docs.qq.com/open/document/app/oauth2/)和[请求头说明](https://docs.qq.com/open/document/app/openapi/v2/file/common/req_headers.html)取得授权。应用须具备所需权限，用户须能访问目标文档。

旧 token / TENCENT_DOCS_TOKEN 不再接受，必须通过 options 显式传入 clientId / openId / accessToken。loader 不接收 Client Secret，不实现 OAuth 回调、令牌交换或自动续期。

fileId 必须是原生 OpenAPI ID，不是分享链接 encoded ID。使用官方[ID 转换](https://docs.qq.com/open/document/app/openapi/v2/file/util/converter.html)和[子表查询](https://docs.qq.com/open/document/app/openapi/v2/smartsheet/sheet/get_sheet.html)取得显式 ID；连接器不自动转换、搜索或选择子表。

Node.js 要求 22.13+，安装后构建：

    npm install
    npm run build

创建被 Git 忽略的 .env.local，不提交真实值：

    TENCENT_DOCS_CLIENT_ID=<应用 Client ID>
    TENCENT_DOCS_OPEN_ID=<授权用户 Open ID>
    TENCENT_DOCS_ACCESS_TOKEN=<OAuth Access Token>
    TENCENT_DOCS_FILE_ID=<原生 OpenAPI fileID>
    TENCENT_DOCS_SHEET_ID=<智能子表 sheetID>
    OPENAI_API_KEY=<模型 API Key>
    OPENAI_MODEL=<模型名称>
    OPENAI_BASE_URL=<可选兼容服务地址>

三个凭证和 fileId / sheetId 必须通过 options 显式传入。调用方可自行从环境变量等配置源读取；示例负责读取，loader 不读取环境变量，AVA 不隐式加载环境文件。

## SDK 与 CLI

    import { AVA } from '@antv/ava';
    const ava = new AVA({ llm: {
      model: process.env.OPENAI_MODEL,
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    } });
    try {
      await ava.source({ type: 'tencent-smartsheet', options: {
        fileId: process.env.TENCENT_DOCS_FILE_ID,
        sheetId: process.env.TENCENT_DOCS_SHEET_ID,
        clientId: process.env.TENCENT_DOCS_CLIENT_ID,
        openId: process.env.TENCENT_DOCS_OPEN_ID,
        accessToken: process.env.TENCENT_DOCS_ACCESS_TOKEN,
      } });
      console.log(await ava.schema());
      console.log(await ava.analyze('按地区统计销售额，按销售额降序排列。'));
    } finally { await ava.dispose(); }

CLI 将模板复制到被 Git 忽略的 .debug/tencent-source.json，在本地文件中填入原生 ID 和三个凭证。不要修改或提交模板中的占位符；CLI 不自动展开环境变量：

    node --env-file=.env.local lib/cli/index.js source @.debug/tencent-source.json
    node lib/cli/index.js schema <datasetId>
    node lib/cli/index.js analyze <datasetId> "按地区统计销售额"
    node lib/cli/index.js dispose <datasetId>

加载、schema 和直接 SQL 不调用模型；自然语言分析使用配置模型。仅支持 Node.js / DuckDB。

## 字段与数据语义

| 原生 fieldType | DuckDB | 规则 |
| --- | --- | --- |
| 1 文本 | VARCHAR | 顺序拼接富文本 text，保留空白；空数组为空字符串。 |
| 2 数字、14 进度、26 货币、28 百分比 | DOUBLE | 有限原始 number；保留零、正负小数，不解析展示格式、不自动乘除 100。 |
| 3 复选框 | BOOLEAN | 保留 true/false，不强转数字或字符串。 |
| 4 日期 | TIMESTAMPTZ | 毫秒字符串，规范化为 UTC。 |
| 12/13 创建/修改时间 | TIMESTAMPTZ | 显式单元格/null 优先，省略时分别使用记录 createTime/updateTime。 |
| 15 电话、16 邮箱 | VARCHAR | 保留字符串、空串、前导零及空白。 |
| 17 单选 | VARCHAR | 唯一选项文本，空选项数组为 null；9 仍为不支持的多选。 |

参考[FieldType/属性](https://docs.qq.com/open/document/app/openapi/v2/smartsheet/field/property.html#fieldtype)、[Value/Records](https://docs.qq.com/open/document/app/openapi/v2/smartsheet/record/value.html#value)。旧枚举页未列全，26/28 已通过当前官方服务元数据及原生 OpenAPI 实测确认，不按标题猜测。

全部 12 类有真实读取证据；货币验证 CNY 原值与元数据，不承诺全部币种渲染、汇率换算或精确金融十进制。普通省略单元格为 null；空行、空表和全空列保留语义及显式类型。源标题作为列名，_record_id 保留身份；拒绝重名、保留列名、非法值和非预期投影字段。图片、附件、多选、人员、计算/公式等复杂类型不暴露，没有支持字段则拒绝加载。

## 可靠性与访问限制

| 选项 | 默认 | 范围 |
| --- | --- | --- |
| pageSize | 100 | 1–100，作用于字段和记录。 |
| maxRecords | 10,000 | 1–100,000，超限失败，不截断。 |
| timeoutMs | 60,000 | 1–110,000 毫秒，覆盖整次加载与等待。 |
| maxRetries | 2 | 0–5，仅重试网络错误与 HTTP 429/500/502/503/504。 |

分别检查 HTTP 与业务 ret；401/403 及业务错误不自动重试，仅遵循有效且不超过 30 秒的 Retry-After。保留 HTTP 状态、业务 ret/msg、请求 ID，以及网络异常的名称、消息、错误码和一层原因；不复制任意响应对象、堆栈或请求头。仅对选定字符串做三项凭证的精确替换；超过 8 KiB 的诊断字段整体省略，不截断字段。非 JSON 或不完整的 HTTP 错误正文不输出，仍保留状态和请求 ID。此防御不代表已观察到腾讯真实错误响应回显凭证。

完整分页读取[字段](https://docs.qq.com/open/document/app/openapi/v2/smartsheet/field/get_fields.html)与[记录](https://docs.qq.com/open/document/app/openapi/v2/smartsheet/record/get_records.html)，检查总量、唯一 ID、递进偏移与终页，并在读完后复核字段元数据。字段上限 1,000；单响应及每次分页读取限 16 MiB，展开后另限 16 MiB UTF-8 JSON 和 1,000,000 单元格（含 null、_record_id）。逐页逐行转换，失败不返回部分结果。

端点固定且拒绝重定向；通过参数化 JSON 和显式 schema 直接创建内存表，不写临时文件，不为模型 SQL 放开临时目录。加载时停止编辑源表；同总量的并发修改并非全部可检测，不提供远端事务快照。

## 两个业务示例与验证

在专用表中手动录入 sales.json 的 8 条虚构订单，字段“文本”为类型 1、“数字”为 2、“单选”为 17、“日期”为 4。AVA-DEMO- 标记限定业务查询范围，日期按 UTC 计算。不要自动向真实业务表追加夹具。

    node --env-file=.env.local examples/tencent-docs/analyze.mjs --verify-only
    node --env-file=.env.local examples/tencent-docs/analyze.mjs

前者经正式 loader/SQL 核对结果，后者额外实际调用模型完成两个自然语言问题；均每页 2 条：

| 问题 | 固定预期与真实核对结果 |
| --- | --- |
| 地区销售贡献 | 华西 4 单/550，华东 4 单/350 |
| 2026 年 1 月至 2 月销售变化 | 500 → 400，变化 -100/-20% |

通过实际数值断言，不依赖模型自评。OpenAPI 版本已通过 SDK/Linux CLI 的真实模型分析；追加 26/28 后另行核对原生数值、SQL 和生命周期，没有重复调用模型。

2026-11-04 精简重构后，重新通过上述正式示例的真实只读 SQL 核对（pageSize=2），地区及月度销售结果一致；本轮未调用模型，也未写入源表。

    npm run lint
    npm run build
    npm test
    npx vitest run tencent __tests__/duckdb/util/file.test.ts

默认腾讯文档测试集中在 __tests__/duckdb/loaders/tencent-docs.test.ts，模拟 HTTP 但经过正式读取、转换、loader 和真实 DuckDB，不需凭证或真实平台网络请求。需要真实只读复验时，按上文运行 analyze.mjs --verify-only；需要两个真实自然语言问题时，运行不带该参数的示例。历史真实源与模型验证范围见上文；上述默认测试用于离线回归。

AI 使用范围见 [AI_USAGE.md](./AI_USAGE.md)。多表、发现、写回和同步不属于本次迁移。
