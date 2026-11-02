# 腾讯文档 OpenAPI 验证结果

验证日期：2026-11-03（Asia/Shanghai）。Refs #1015。

## 范围与环境

本次验证针对正式 tencent-smartsheet OpenAPI loader，而非旧 MCP 或 JSON 导入 PoC。范围为授权单表只读快照，支持 12 类标量，不包含多表、写回或同步。

- Windows：Node.js 22.21.0、npm 10.9.4。
- Linux：官方 Node Bookworm 用户态，Node.js 22.23.4、npm 10.9.9，在 WSL 独立临时 chroot 中全新安装依赖；确认不存在 MCP 客户端依赖。
- 真实接口使用专用虚构数据文档；配置、凭证和真实 ID 不包含在交付文件中。

## 自动化检查

| 检查 | 结果 |
| --- | --- |
| Windows 全量测试 | 770 通过 / 56 跳过 |
| Linux 全量测试 | 772 通过 / 54 跳过 |
| Windows 腾讯文档及文件系统定向测试 | 267 通过 / 3 跳过 |
| Linux 腾讯文档及文件系统定向测试 | 269 通过 / 1 跳过 |
| 两端 lint、CommonJS/ESM 构建 | 通过 |
| 文档站生产构建、check:docs | 通过，22 页 / 1,379 链接及相关检查 |

默认跳过外部服务/模型集成用例；Windows 另跳过两个 Unix 文件系统测试，Linux 已执行。上述为本地结果，不代表托管 CI 已通过。

测试覆盖 HTTP/业务错误、限流与重试、期限和取消、诊断脱敏及截断边界、完整分页、字段变化、空表/空值/原始标量、稀疏展开预算、独占临时文件及清理。包含 78 项脱敏边界、47 项恢复标量、31 项货币/百分比专项回归。

## 真实接口与分析结果

- 独立 ID 转换成功；正式 loader 每页 2 条完成字段、记录分页及字段元数据复核。
- 当前专用表为 13 个源字段、18 条记录。图片排除；12 个标量与 _record_id 可供分析。
- verify-scalars.mjs 在 Windows/Linux 核对复选框、系统时间、进度、电话和邮箱。系统时间与独立读取的记录 createTime/updateTime 逐行精确比较。
- verify-money.mjs 在 Windows/Linux 确认独立货币 26、百分比 28、两列 DOUBLE、零/正/负数及聚合。0.125 不自动缩放；货币显示元数据为 CNY、2 位小数。
- 专用夹具按明确许可分两次有界准备；最近新增前的 15 条记录在原 11 列上的规范化指纹一致。不提供自动写入脚本。
- 当前版本真实通过 SDK 确定性业务 SQL，以及 Linux CLI source → schema → query → dispose 和释放后访问拒绝。

| 业务问题 | 固定预期与真实结果 |
| --- | --- |
| 地区销售贡献 | 华西 4 单 / 550，华东 4 单 / 350 |
| 2026 年 1 月至 2 月销售变化 | 500 → 400，变化 -100 / -20% |

两个问题均已通过 OpenAPI loader 的真实 SDK/CLI 模型分析。执行发生在恢复 10 类标量后；追加 26/28 映射后，重跑了上述数值、读取和生命周期验证，没有重复调用模型。此处区分证据范围，不把前序模型调用写成最终源码重新执行。

## 复现

先按 README.md 准备原生 ID、OAuth 配置及专用虚构数据，再运行：

    npm run lint
    npm run build
    npm test
    npx vitest run tencent __tests__/duckdb/util/file.test.ts
    node --env-file=.env.local examples/tencent-docs/analyze.mjs --verify-only
    node --env-file=.env.local examples/tencent-docs/verify-scalars.mjs
    node --env-file=.env.local examples/tencent-docs/verify-money.mjs
    node --env-file=.env.local examples/tencent-docs/analyze.mjs

真实接口 Vitest 用例需显式设置 AVA_TENCENT_INTEGRATION=1。Linux/macOS 可运行 cli-e2e.mjs --with-model。模型调用会使用配置的模型服务；不要默认并入离线套件。

根包构建完成后，再在 site 中运行 npm run build 和 npm run check:docs，避免根目录清理与站点构建并行。

## 限制

OAuth 凭证和原生 ID 是配置迁移。异常路径主要通过受控 HTTP 测试，不声称在真实账号逐项制造过期、配额耗尽等情况。复杂字段、远端事务快照及自动续期不在范围内；数值和字段语义详见 OPENAPI_FIELDS.md。
