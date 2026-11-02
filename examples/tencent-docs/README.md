# 腾讯文档智能表格接入 AVA：原生 OpenAPI

将显式选择、已授权的单个智能子表，通过 `DataSourceConfig → loader → DuckDB → AVA` 进行只读分析。loader 使用原生 `fetch`，仅向官方固定 HTTPS 端点发送 `getFields` / `getRecords` 请求；不再依赖 MCP 握手、工具目录或 SDK，模型不能选择远端写操作。

## 平台调研、授权与迁移

腾讯文档是协作办公 SaaS，智能表格的结构化业务记录适合销售汇总、项目跟踪和运营分析。直接调用 OpenAPI 可减少初版 MCP 实现的协议及 SDK 层，并直接控制 HTTP 请求、诊断与资源限制。

官方资料：

- [开发者与应用接入](https://docs.qq.com/open/document/app/get_started.html)：注册开发者应用，完成相应审核。
- [OAuth](https://docs.qq.com/open/document/app/oauth2/) 与[请求头](https://docs.qq.com/open/document/app/openapi/v2/file/common/req_headers.html)：获取应用 Client ID、授权用户 Open ID（令牌响应的 `user_id`）及 Access Token。用户需能访问文档，应用需具备相应审核、授权权限。Client Secret 用于使用方自己的令牌交换，不传入 loader。
- [读取字段](https://docs.qq.com/open/document/app/openapi/v2/smartsheet/field/get_fields.html)与[读取记录](https://docs.qq.com/open/document/app/openapi/v2/smartsheet/record/get_records.html)：POST `/openapi/smartbook/v2/files/{fileID}/sheets/{sheetID}`，分别使用 `getFields` / `getRecords` JSON 操作，同时检查 HTTP 状态与业务 `ret`。
- [ID 转换](https://docs.qq.com/open/document/app/openapi/v2/file/util/converter.html)与[子表 ID 查询](https://docs.qq.com/open/document/app/openapi/v2/smartsheet/sheet/get_sheet.html)。

**配置迁移：**删除 `options.token` / `TENCENT_DOCS_TOKEN`，改用 `clientId`、`openId`、`accessToken` 或下述环境变量。旧 `token` 选项会被拒绝，不会被解释为 OAuth 凭证。loader 不提供 OAuth 回调、令牌交换或自动续期；使用方需自行取得、更新令牌。MCP 的配额与错误码不适用于 OpenAPI，请以当前平台文档和应用控制台为准。

**字段兼容性：**已按官方数值合约补回复选框（3）、创建/修改时间（12/13）、进度（14）、电话（15）、邮箱（16），与文本（1）、数字（2）、日期（4）、单选（17）加上已实测的货币（26）、百分比（28），合计 12 种。旧版公开 v2 枚举页未列全；26/28 已通过官方服务元数据与原生 OpenAPI 创建、读取和正式 loader 实测确认，不按列名或 UI 显示猜测类型。已通过专用虚构夹具验证这些原生类型；系统时间的原生响应与适配规则单独说明。详见[字段合约与证据](./OPENAPI_FIELDS.md)。

## 安装与本地配置

要求 Node.js 22.13+。在仓库根目录执行：

```sh
npm install
npm run build
```

若现有 npm 对等依赖解析出现 `Cannot read properties of null (reading 'edgesOut')`，本地已验证的替代方式是 `npm install --legacy-peer-deps`。

创建被 Git 忽略的本地环境文件，勿提交真实值：

```dotenv
TENCENT_DOCS_CLIENT_ID=<应用 Client ID>
TENCENT_DOCS_OPEN_ID=<授权用户 Open ID>
TENCENT_DOCS_ACCESS_TOKEN=<OAuth Access Token>
TENCENT_DOCS_FILE_ID=<原生 OpenAPI fileID，不是分享链接编码 ID>
TENCENT_DOCS_SHEET_ID=<显式指定的智能子表 sheetID>
OPENAI_API_KEY=<模型 API Key>
OPENAI_MODEL=<可用模型名称>
OPENAI_BASE_URL=<可选的兼容服务地址>
```

三个凭证选项分别优先于各自的环境变量。SDK 始终要求显式 `fileId` / `sheetId`；只有示例脚本会从环境变量读取 ID。AVA 不会隐式加载环境文件。

### 原生 ID 与独立转换

分享链接编码 ID 与原生 OpenAPI `fileID` **不同**。AVA 不会扫描私人文件，也不在每次加载时悄悄转换 ID。只有编码 ID 时，在本地环境文件中设置 `TENCENT_DOCS_ENCODED_FILE_ID` 和 `TENCENT_DOCS_SHEET_ID`，再执行：

```sh
node --env-file=.env.local examples/tencent-docs/convert-id.mjs .debug/tencent-native-source.json
```

该独立命令只发送一次已授权的 GET `/openapi/drive/v2/util/converter?type=2&value=...`：25 秒期限、8 KiB 响应上限、不重试、不跟随重定向。转换接口有自身的权限要求。命令通过独占创建生成受限、无凭证的本地配置，拒绝覆盖已有文件或符号链接，不打印凭证或 ID。

CLI 可直接使用生成的配置；SDK 示例则需将其中的原生 `fileId` 填入被忽略的本地环境文件。`sheetID` 请通过官方子表查询接口，在自己的已授权 API 客户端中取得；本版不提供自动发现。

## SDK 示例

```javascript
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
  } });
  console.log(await ava.schema());
  const result = await ava.analyze('按地区统计销售额，按销售额降序排列。');
  console.table(result.data);
} finally { await ava.dispose(); }
```

加载、schema 查询和直接 SQL 不调用模型；自然语言分析使用配置的模型。本数据源仅支持 Node.js / DuckDB，不支持浏览器、Python 或 JavaScript 引擎。

## CLI 示例

凭证保留在继承的环境变量中，配置文件只保存原生 ID 等非凭证选项：

```sh
node --env-file=.env.local lib/cli/index.js source @.debug/tencent-native-source.json
node lib/cli/index.js schema <datasetId>
node lib/cli/index.js analyze <datasetId> "按地区统计销售额"
node lib/cli/index.js dispose <datasetId>
```

现有 CLI 会话仅支持 Linux/macOS。Windows 用户请使用 SDK，或在 WSL 中运行 CLI。真实子进程验证命令：

```sh
node --env-file=.env.local examples/tencent-docs/cli-e2e.mjs
node --env-file=.env.local examples/tencent-docs/cli-e2e.mjs --with-model
```

脚本检查加载、schema、SQL、释放及释放后访问拒绝；`--with-model` 额外检查两个真实模型分析。脚本只创建临时本地配置，不写入腾讯文档源数据。

## 字段与数据语义

| OpenAPI `fieldType` | DuckDB 类型 | `record.values[fieldTitle]` 转换规则 |
| --- | --- | --- |
| 1：文本 | `VARCHAR` | 顺序拼接富文本项的 `text`；保留空白，空数组转为空字符串。 |
| 2：数字 | `DOUBLE` | 保留有限原始数值及零，不应用显示格式；不提供精确金融十进制算术。 |
| 26：货币、28：百分比 | `DOUBLE` | 已通过原生接口和正式 loader 实测；保留有限原始数值，不套用显示格式或倍率。 |
| 4：日期 | `TIMESTAMPTZ` | 解析毫秒 Unix 时间戳字符串，规范化为 UTC。 |
| 3：复选框 | `BOOLEAN` | 保留真正的 true/false，不将 0 或字符串强转为布尔值。 |
| 12/13：创建/修改时间 | `TIMESTAMPTZ` | 优先保留显式单元格（包括 null）；被省略时，12/13 分别读取源记录 createTime/updateTime 的毫秒字符串。 |
| 14：进度 | `DOUBLE` | 保留有限原始数值，0.125 不自动改成 12.5 或附加百分号。 |
| 15/16：电话/邮箱 | `VARCHAR` | 保留字符串、前导零和空白，不强制格式化或转为数字。 |
| 17：单选 | `VARCHAR` | 使用唯一选项的文本，空选项数组转为 null；不将类型 9 当作单选。 |

图片（5）、附件、人员、多选、计算/查找/公式及其他类型均不暴露。没有支持字段时拒绝加载。源标题作为列名；拒绝不区分大小写的重名以及保留名称 `_record_id`。`_record_id` 保留源记录身份。

普通字段的 null 或省略值转为 null；原生系统时间 12/13 的省略值遵循上述源元数据规则，显式 null 仍保留。空行保留，空表和全空列保持显式 SQL 类型。支持字段中的非法值或非预期投影字段导致整次加载失败，不返回部分数据。

## 可靠性与限制

| 选项 | 默认值 | 范围与行为 |
| --- | --- | --- |
| `pageSize` | 100 | 1–100，作用于字段与记录分页。 |
| `maxRecords` | 10,000 | 1–100,000，超限失败，不静默截断。 |
| `timeoutMs` | 60,000 | 1–110,000 毫秒，覆盖整次加载、正文读取及等待。 |
| `maxRetries` | 2 | 0–5，只重试网络失败及 HTTP 429/500/502/503/504。 |

仅遵循有效且不超过 30 秒的 `Retry-After`，否则返回 HTTP 错误。HTTP 401/403 和业务 `ret` 错误不自动重试；不沿用 MCP 错误码策略。OAuth 续期或权限调整由使用方在 loader 外完成。

上限为 1,000 个字段、单次响应及每次分页读取 16 MiB；展开后另设 16 MiB UTF-8 JSON 和 1,000,000 单元格预算，计入列名、null 和 `_record_id`。有效行数上限为 `min(maxRecords, floor(1000000 / (supported field count + 1)))`。逐页逐行转换，不保留全部原始记录，超预算的稠密行不予保留。

分页检查总量、重复/缺失 ID、递进偏移和终页完整性，记录读取后复核支持字段元数据。加载期间请停止编辑：相同记录数的修改无法全部检出，这不是远端事务一致快照或持续同步。

保留上游 `ret` / `msg`、HTTP 状态、可用请求 ID 和网络异常链。HTTP 诊断正文限制为 8 KiB 并标记截断，业务诊断也有上限。业务错误先脱敏再限长；非 2xx 正文保留截断状态，在附加标记前保守移除末尾可能属于凭证前缀的内容，不额外等待读取后续字节。新输出边界同样检查，UTF-8 不完整尾字符不输出；少量歧义正常尾部文本可能被省略。对三项实际配置凭证、嵌套属性及堆栈脱敏；其他平台返回上下文仍可能包含文档 ID。固定端点、拒绝重定向。临时源文件通过独占 `0600` 创建，写入失败时清理，内存物化后删除，不为分析放开临时目录访问。

### 货币、百分比及新增类型真实校验

原生货币（26）、百分比（28）均已验证为有限 number，按 DOUBLE 保留原值。`0.125` 保持 `0.125`，不自动乘除 100，不解析带货币符号、千分位或百分号的展示字符串。普通数字类型 2 同样保留数值。币种和显示小数位不是汇率换算或精确金融十进制计算；当前真实货币夹具为 CNY、2 位小数，不声称遍历全部币种的 UI 渲染。

专用虚构测试表已真实验证全部 12 类标量。系统字段 12/13 在 values 中被省略，源记录顶层返回毫秒字符串；只对这两种原生类型映射对应系统元数据，不覆盖显式值或 null，不按列名猜测。只读脚本将源记录时间与 DuckDB epoch_ms 逐行比对，详见 OPENAPI_FIELDS.md。

如需在另一专用测试表复现，必须先取得新的明确许可或由用户手工准备，再参考 `scalars.json` 手工添加其 `columns` 中的 6 个字段及两条 `AVA-TYPE-` 记录。将 marker 填入原有“文本”列，其他值填入相应“校验_”列；创建/修改时间字段由平台自动生成，不手工伪造。不要改原业务记录，不添加子表或视图。仓库只提供模板与只读验证脚本，**不会自动创建或写入这些夹具**。

```sh
# 先构建；仅在上述字段及记录已明确获准准备后运行：
node --env-file=.env.local examples/tencent-docs/verify-scalars.mjs
```

脚本不调用模型，先检查原生数值类型，再检查正式 loader 的 SQL 类型、false、零进度、前导零字符串，并用独立读取的源元数据精确核对系统时间；失败不会打印上游正文或原始行。该脚本已在本轮最终版本的 Windows/Linux 真实执行通过，不能只用原四类业务汇总替代。

## 两个可复现的业务示例

在专用测试智能表格中**手工录入** `sales.json` 的 8 条虚构订单；不再提供写入或播种脚本，不要向真实业务文档追加夹具。字段如下：

| 标题 | 原生类型 | 业务含义 |
| --- | --- | --- |
| 文本 | 1 | 带 `AVA-DEMO-` 标记的产品名称。 |
| 数字 | 2 | 订单销售额。 |
| 单选 | 17 | 地区，包含华东、华西。 |
| 日期 | 4 | 订单时间。 |

标记用于限定断言范围，排除其他记录和空行，日期按 UTC 计算。

```sh
# 不调用模型，直接检查源数据、loader 和 DuckDB 的确定性结果：
node --env-file=.env.local examples/tencent-docs/analyze.mjs --verify-only
# 真实调用模型完成两个自然语言问题，并断言固定结果：
node --env-file=.env.local examples/tencent-docs/analyze.mjs
```

两种模式均使用每页 2 条，验证字段与记录分页。业务预期：

1. 地区贡献：华西 4 单 / 550，华东 4 单 / 350，华西销售额最高。
2. 月度变化：2026 年 1 月 500，2 月 400，变化 −100 / −20%。

以实际查询数值断言正确性，不依据模型说明文字。当前证据见[验证报告](./VALIDATION.md)，AI 辅助及人工审阅要求见 [AI 使用报告](./AI_USAGE.md)。

## 测试

```sh
npx vitest run tencent
# 在本地配置 AVA_TENCENT_INTEGRATION=1 后显式启用真实只读验证：
node --env-file=.env.local node_modules/vitest/vitest.mjs run __tests__/duckdb/loaders/tencent-live.test.ts
```

默认测试不需要凭证或网络，使用原生请求/响应模拟与真实内存 DuckDB。本次不增加多表 JOIN、发现、视图、用户字段选择、普通表格范围、写回、OAuth 服务或同步。多表增强作为独立增量方案等待维护者确认。Refs #1015。

## 货币与百分比的真实只读复验

`money.json` 给出两个独立原生字段（26/28）和三条虚构记录模板，覆盖零值、正负金额及 0.125/-0.25 原始比例。仅在已获许可的专用文档中手工准备；`verify-money.mjs` 只读，不创建字段或记录：

```sh
node --env-file=.env.local examples/tencent-docs/verify-money.mjs
```

脚本独立读取原生字段和记录，再通过正式 `tencent-smartsheet` loader 检查两列 DOUBLE、逐行数值和聚合，按每页 2 条验证分页。不调用模型，不使用 JSON loader 旁路。
