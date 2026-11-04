# 飞书多维表格（Feishu Bitable）分析示例

这个目录演示如何把一张飞书多维表格接进 AVA（antvis/AVA#1012），并用两个自然语言问题做分析：

| 示例 | 自然语言问题 | 文件 |
| --- | --- | --- |
| 1 | 按月统计各区域销售额并找出环比下滑的区域 | `01-sales-by-region.ts` |
| 2 | 列出库存低于安全线的商品并按缺口排序 | `02-stock-shortage.ts` |

附带的 `mock-table.json` 是一份可离线复现的小数据集（10 行，字段：区域 / 月份 / 商品 / 销售额 / 库存 / 安全库存 / 负责人 / 标签 / 关联订单 / 备注），
`__tests__/duckdb/loaders/feishu-e2e.test.ts` 用它跑完整的端到端回归。

## 支持范围

- 只读：加载器只调用 Bitable 的 `fields` / `records` 读取接口，不会写回表格。
- 引擎：仅 DuckDB（`engine: { type: 'duckdb' }`）。Python / JavaScript 引擎不能加载该数据源。
- 视图名：整张表注册成一个只读视图 `data`；URL 里的 `?view=` 会被忽略，加载的是全表而不是某个视图。
- 链接形式：`/base/<app_token>?table=<table_id>`，以及知识库里的 `/wiki/<node_token>?table=<table_id>`。
  wiki 链接会先调用 `get_node`，用节点托管的 `obj_token` 当作 app token。
- 省略 `?table=` 时，只有单张表会自动选中；多张表会报错并列出表名和 table_id。
- 字段：飞书字段类型会映射成 DuckDB 列；不支持的类型（如 Stage 审批流、Button 按钮）会被省略。
  人员、附件、关联、公式、地理位置、群组等复杂单元格会拍平成逗号分隔的文本（关联字段取 record_id）。

## 一、应用配置与权限（需要真实飞书租户）

以下步骤在飞书开放平台完成，**必须在真实租户里操作，mock 模式不需要**。

1. **用手机号绑定的飞书账号登录** <https://open.feishu.cn/>。
   用个人账号（例如豆包账号）创建的应用在换取 `tenant_access_token` 时会返回 `Feishu Error 21001`，
   这是平台策略限制，换一个手机号绑定的飞书账号创建应用即可。

2. **创建企业自建应用**：开放平台 → 开发者后台 → 创建应用 → 企业自建应用，记下 `App ID` 和 `App Secret`。

3. **开通权限**：应用 → 权限管理，添加
   - `bitable:app:readonly` —— 读取多维表格（必需）；
   - `wiki:wiki:readonly` —— 仅当数据表挂在知识库里时才需要。

4. **创建版本并发布**：权限改动要在「版本管理与发布」里创建版本、申请并通过审核后才生效。

5. **把应用加为表格协作者**：打开多维表格 → 右上角「分享」→ 添加协作者 → 搜索应用名称 → 权限选「可阅读」。
   如果表在知识库里，还要把应用加为该知识空间成员（这与文档协作者是两套权限）。
   如果多维表格开启了高级权限，只读范围需要应用具备管理权限，否则同样会收到
   `Feishu Error 131006: permission denied`。

6. **导出凭证**（三选一，优先级从高到低）：

   ```sh
   # 环境变量
   export AVA_FEISHU_APP_ID=cli_xxxxxxxx
   export AVA_FEISHU_APP_SECRET=xxxxxxxx

   # 或配置文件（CLI 在终端里首次运行也会提示输入并保存到 ~/.ava/feishu.json）
   mkdir -p ~/.ava && cat > ~/.ava/feishu.json <<'JSON'
   { "appId": "cli_xxxxxxxx", "appSecret": "xxxxxxxx" }
   JSON

   # 或写进 source 配置（注意不要提交到版本库）
   ```

7. **定位 app_token / table_id**：打开多维表格，地址形如
   `https://<tenant>.feishu.cn/base/<app_token>?table=<table_id>&view=<view_id>`。
   `base/` 后面的就是 app token，`table=` 就是 table id；`view=` 可以忽略。

## 二、两个自然语言分析

CLI 会用环境变量里的凭证加载数据源，并在 `OPENAI_API_KEY` 已设置时把自然语言交给 LLM 生成 SQL：

```sh
export OPENAI_API_KEY=sk-...        # ava source 时就会被固定进会话
export AVA_FEISHU_APP_ID=cli_xxxxxxxx
export AVA_FEISHU_APP_SECRET=xxxxxxxx

ava source "https://<tenant>.feishu.cn/base/<app_token>?table=<table_id>" > session.json
DATASET=$(node -p "require('./session.json').datasetId")
```

也可以用 `@file` 传配置（等价写法，适合把凭证放在单独的、不入库的文件里）：

```json
{
  "type": "feishu-bitable",
  "options": {
    "url": "https://<tenant>.feishu.cn/base/<app_token>?table=<table_id>",
    "appId": "<app-id>",
    "appSecret": "<app-secret>"
  }
}
```

```sh
ava source @feishu.json > session.json
```

### 示例 1：按月统计各区域销售额并找出环比下滑的区域

```sh
ava analyze "$DATASET" "按月统计各区域销售额并找出环比下滑的区域"

# 不想经过 LLM 时，把下文的等价 SQL 存成 sales-mom.sql 再执行：
ava query "$DATASET" --dsl @sales-mom.sql
```

等价的 DuckDB SQL（见 `queries.ts` 的 `SALES_MOM_SQL`）：

```sql
WITH monthly AS (
  SELECT "区域", "月份", SUM("销售额") AS "销售额"
  FROM data
  GROUP BY "区域", "月份"
),
with_previous AS (
  SELECT "区域", "月份", "销售额",
         LAG("销售额") OVER (PARTITION BY "区域" ORDER BY "月份") AS "上月销售额"
  FROM monthly
)
SELECT "区域", "月份", "销售额", "上月销售额",
       ROUND(("销售额" - "上月销售额") * 100.0 / "上月销售额", 2) AS "环比百分比"
FROM with_previous
WHERE "上月销售额" IS NOT NULL AND "销售额" < "上月销售额"
ORDER BY "环比百分比" ASC;
```

期望结果（`ava analyze` 返回 `{ query, text, sql, schema, data, rowCount }`，`data` 形如）：

```json
[
  { "区域": "华东", "月份": "2026-03", "销售额": 110000, "上月销售额": 132000, "环比百分比": -16.67 },
  { "区域": "华北", "月份": "2026-02", "销售额": 86000, "上月销售额": 90000, "环比百分比": -4.44 }
]
```

> 华南三个月连续增长、西南只有一个月份，因此都不在「环比下滑」结果里。

### 示例 2：列出库存低于安全线的商品并按缺口排序

```sh
ava analyze "$DATASET" "列出库存低于安全线的商品并按缺口排序"
ava query "$DATASET" --dsl @stock-shortage.sql
```

等价的 DuckDB SQL（见 `queries.ts` 的 `STOCK_SHORTAGE_SQL`）：

```sql
SELECT "区域", "商品", "库存", "安全库存",
       "安全库存" - "库存" AS "缺口",
       ROUND(("安全库存" - "库存") * 100.0 / "安全库存", 1) AS "缺口百分比"
FROM data
WHERE "月份" = (SELECT MAX("月份") FROM data)
  AND "库存" < "安全库存"
ORDER BY "缺口" DESC;
```

期望结果：

```json
[
  { "区域": "华东", "商品": "智能音箱", "库存": 60, "安全库存": 100, "缺口": 40, "缺口百分比": 40 },
  { "区域": "华南", "商品": "空气净化器", "库存": 47, "安全库存": 80, "缺口": 33, "缺口百分比": 41.3 },
  { "区域": "华北", "商品": "扫地机器人", "库存": 18, "安全库存": 30, "缺口": 12, "缺口百分比": 40 }
]
```

### SDK 写法

两个脚本（`01-sales-by-region.ts`、`02-stock-shortage.ts`）走的就是 SDK：

```ts
await ava.source({
  type: 'feishu-bitable',
  options: { url, appId, appSecret }, // 或 appToken + tableId
});
const result = await ava.analyze('按月统计各区域销售额并找出环比下滑的区域');
```

## 三、离线运行（不需要飞书租户）

`--mock` 会把全局 `fetch` 换成 `mock.ts`，用 `mock-table.json` 模拟飞书接口：
一次 token 调用、一次字段读取、记录分成 2 页（`pageSize: 5`，靠 `page_token` 翻页）。
LOADER 代码、字段转换、DuckDB 视图和 SQL 都跟真实环境完全一致，只有 HTTP 响应是假的。

```sh
# 在仓库根目录执行；esbuild 随 vite 一起安装，不需要额外依赖
npx esbuild examples/feishu-bitable/01-sales-by-region.ts \
  --bundle --platform=node --format=cjs --packages=external --outfile=node_modules/.tmp/01-sales-by-region.js
node node_modules/.tmp/01-sales-by-region.js --mock

npx esbuild examples/feishu-bitable/02-stock-shortage.ts \
  --bundle --platform=node --format=cjs --packages=external --outfile=node_modules/.tmp/02-stock-shortage.js
node node_modules/.tmp/02-stock-shortage.js --mock
```

没有 `OPENAI_API_KEY` 时脚本打印「未设置 OPENAI_API_KEY」并直接执行等价 SQL；
设置了就调用 `ava.analyze()`，由 LLM 现场生成 SQL。

换成真实表格只需导出三个环境变量（脚本会自动切到 live 模式，也可以用 `--mock` 强制离线）：

```sh
AVA_FEISHU_BITABLE_URL="https://<tenant>.feishu.cn/base/<app_token>?table=<table_id>" \
AVA_FEISHU_APP_ID=cli_xxxxxxxx \
AVA_FEISHU_APP_SECRET=xxxxxxxx \
node node_modules/.tmp/01-sales-by-region.js
```

端到端回归测试用的也是这份 mock 数据：

```sh
npx vitest run __tests__/duckdb/loaders/feishu-e2e.test.ts
```

## 哪些步骤需要真实凭证？

| 步骤 | 需要真实飞书凭证？ |
| --- | --- |
| 创建应用、开通权限、发布版本、添加协作者 | 需要（开放平台 + 表格后台手工操作） |
| `ava source "https://…/base/…"`、`ava schema`、`ava analyze`、`ava query` | 需要 |
| `node node_modules/.tmp/01-sales-by-region.js --mock`、`node node_modules/.tmp/02-stock-shortage.js --mock` | 不需要 |
| `feishu-e2e.test.ts` | 不需要（HTTP 全部打桩） |

## 常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| `Feishu Error 21001` | 应用由个人账号（如豆包账号）创建，平台策略禁止其换取 tenant token。换手机号绑定的飞书账号重建应用。 |
| `Feishu Error 131006: permission denied` | 应用没被加为该表的协作者，或缺少 `bitable:app:readonly`；wiki 表还需要 `wiki:wiki:readonly` 与知识空间成员身份；开了高级权限的表需要管理权限。 |
| `Feishu Bitable … has N tables` | 链接里没带 `?table=`，且该多维表格有多张表；按报错列出的 table_id 补上参数。 |
| `Feishu Bitable source requires appId and appSecret` | 非交互环境（管道、CI）拿不到凭证。设置 `AVA_FEISHU_APP_ID` / `AVA_FEISHU_APP_SECRET` 或写 `~/.ava/feishu.json`。 |
| 改完表格数据后结果没变 | 每次 `ava source` 都会重新全量读取；已在运行的会话不会自动刷新，需要重新加载数据源。 |
| `?view=` 不生效 | 设计如此：加载的是整张表，`view` 参数被忽略，请在 SQL 里自己过滤。 |
