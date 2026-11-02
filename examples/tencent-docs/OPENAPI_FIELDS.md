# 腾讯文档 OpenAPI 标量字段合约与真实验证

核对及验证日期：2026-11-03（Asia/Shanghai）。仅针对腾讯文档 `smartbook/v2`，不混用企业微信或 MCP 字段枚举。

## 官方依据

- [FieldType 与字段属性](https://docs.qq.com/open/document/app/openapi/v2/smartsheet/field/property.html#fieldtype)：原生数值类型、日期显示属性、数字精度等。
- [Fields 结构](https://docs.qq.com/open/document/app/openapi/v2/smartsheet/field/field.html#fields)：`fieldID`、`fieldTitle`、`fieldType` 与匹配属性。
- [单元格 Value](https://docs.qq.com/open/document/app/openapi/v2/smartsheet/record/value.html#value)：标量及选择项的原始值形态。
- [Records 结构](https://docs.qq.com/open/document/app/openapi/v2/smartsheet/record/value.html#records)及[查询记录示例](https://docs.qq.com/open/document/app/openapi/v2/smartsheet/record/get_records.html)：`values` 之外的记录级 `createTime` / `updateTime`；示例使用毫秒字符串。

官方旧示例曾将 9 配合单选样式；当前枚举表明确 9 为多选、17 为单选，实测也为 17，故不把 9 作为单选别名。

## 已实现并真实验证的 12 种标量

| 原生类型 | DuckDB | 转换规则 |
| --- | --- | --- |
| 1 文本 | `VARCHAR` | 顺序拼接富文本项；保留空文本与空白。 |
| 2 数字 | `DOUBLE` | 仅接受有限 number；不套显示格式。 |
| 26 货币、28 百分比 | `DOUBLE` | 原生接口与正式 loader 已实测；保留有限原值，不按符号、精度或 UI 名称强转，不做倍率变换。 |
| 3 复选框 | `BOOLEAN` | 仅接受 boolean；保留 false，不强转 0 或字符串。 |
| 4 日期 | `TIMESTAMPTZ` | 毫秒时间戳字符串，规范化为 UTC。 |
| 12 创建时间 | `TIMESTAMPTZ` | 优先保留显式字段单元格；被省略时读取源记录 `createTime`，按毫秒字符串解析。 |
| 13 修改时间 | `TIMESTAMPTZ` | 同上，被省略时读取源记录 `updateTime`。 |
| 14 进度 | `DOUBLE` | 保留有限原始数值，不乘除 100。 |
| 15 电话 | `VARCHAR` | 保留原字符串、前导零和空白，不转数字。 |
| 16 邮箱 | `VARCHAR` | 保留原字符串，不强制归一化或额外格式校验。 |
| 17 单选 | `VARCHAR` | 唯一选项文本；空选择为 null。 |

普通省略单元格为 null。显式 null 始终保持 null，包括系统时间；仅对“原生类型恰为 12/13 且单元格被省略”的情况使用对应源记录元数据。两者都缺失则保持 null。无效的被使用值导致加载失败，不隐式猜测日期单位或按列标题选择来源。

### 系统时间：真实响应发现与适配

新增真实字段后发现：原生 12/13 的字段信息存在，但记录 `values` 中不含这两个键；同一记录顶层 `createTime` / `updateTime` 则是 13 位毫秒字符串。因此初始“只读单元格”的候选实现会产生 null，不能算恢复完成。

最终实现按上述明确规则使用**源记录的权威系统时间**，不是用本地当前时间补值，也不将普通日期或同名字符串字段视为系统时间。真实校验先独立读取原始记录元数据，再将其数值与正式 loader/DuckDB 的 `epoch_ms` 结果逐行比对，同时检查合理时间范围。两条新增记录均通过。47 项正式测试覆盖系统元数据、显式值/显式 null 优先级、无关字段不映射及错误元数据拒绝等。

## 货币、百分比：原生 26/28 已确认

旧版公开 v2 FieldType 页面没有列全，不能据此认定类型不存在。2026-11-03 通过腾讯文档官方 MCP 服务的公开工具 schema，发现数字 FieldType 描述明确列出 26 货币、28 百分比及对应属性；随后用**原生 OpenAPI** 成功创建并读回两类字段及 3 条虚构记录，确认实际返回 fieldType=26/28。这里只把服务 schema 用于开发调研，正式连接器仍只调用 OpenAPI，不恢复 MCP SDK 依赖。

- 货币：原生 propertyCurrency 元数据读回 CNY、2 位小数及千位符配置；0、1234.56、-12.34 的接口原值为 number，正式 loader/DuckDB 保持相同数值。
- 百分比：原生 propertyPercentage 配置 2 位小数；0、0.125、-0.25 的原值同样为 number，loader 不自动乘除 100。
- 正式 loader 两列为 DOUBLE，单独覆盖 null/缺失、非法展示字符串、空表类型及分页；数值聚合按浮点容差断言，不宣称精确金融十进制或汇率换算。
- 本轮没有通过浏览器验证 UI 的实际渲染，也未遍历所有币种。这里确认的是原生类型、显示元数据、原始数值与分析结果，不将普通类型 2 的成功冒充独立类型 26/28 的证据。

当前已验证的 12 类标量覆盖原 MCP 首版声明的标量类别；仍不支持复杂类型，不声称整个授权/ID 配置迁移无损。

## 实测夹具与复现

专用测试表当前为 13 个源字段、18 条记录，包含 12 类标量和一个被排除的图片字段。业务订单以 AVA-DEMO- 标记，恢复标量以 AVA-TYPE- 标记，货币/百分比以 AVA-MONEY- 标记，互不混入业务汇总。

scalars.json / money.json 为无真实 ID 的虚构模板。手动准备专用数据后，执行只读脚本：

    node --env-file=.env.local examples/tencent-docs/verify-scalars.mjs
    node --env-file=.env.local examples/tencent-docs/verify-money.mjs

前者检查六类恢复标量并独立比较源系统时间；后者核对独立 26/28 的原生类型、值、正式 loader 列类型和聚合。两者均不创建字段、记录、子表或视图，不调用模型。实际验证结果见 VALIDATION.md。
