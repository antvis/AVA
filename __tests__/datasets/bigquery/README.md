# BigQuery 测试数据集

`init.sql` 创建 BigQuery engine 集成测试使用的 `ava_bigquery_test` 数据集：带主外键约束的 `customers`、`orders`、`order notes`，覆盖全部 GoogleSQL 类型的 `value_types`，以及视图 `paid_orders`。脚本只使用 DDL，可以在没有结算账号的 [BigQuery 沙箱](https://cloud.google.com/bigquery/docs/sandbox) 中执行；沙箱中的表 60 天后过期，过期后重新执行即可。

测试默认跳过，仅在 `AVA_BIGQUERY_TEST=1` 时连接真实的 BigQuery，不会自动创建数据集。

## 准备

1. 在 Google Cloud 控制台创建或选择一个项目，打开 BigQuery 页面。
2. 以项目所有者身份在 BigQuery 控制台执行 `init.sql`，创建位于 `US` 的 `ava_bigquery_test` 数据集。
3. 创建服务账号，授予项目级角色 `BigQuery Job User`（`roles/bigquery.jobUser`）与 `BigQuery Data Viewer`（`roles/bigquery.dataViewer`），下载 JSON 密钥。服务账号保持只读，测试依赖这一点验证写入语句会被拒绝。

## 运行

```sh
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
export AVA_BIGQUERY_PROJECT=<project-id>

AVA_BIGQUERY_TEST=1 npx vitest run __tests__/remote/bigquery
```

`AVA_BIGQUERY_DATASET` 可以指定其他名称的测试数据集。`__tests__/cases/bigquery-analysis.test.ts` 用公共数据集 `bigquery-public-data.thelook_ecommerce` 验证自然语言分析结果与直接查询一致，还需要配置 `OPENAI_API_KEY`、`OPENAI_MODEL` 和 `OPENAI_BASE_URL`：

```sh
AVA_BIGQUERY_TEST=1 npx vitest run __tests__/cases/bigquery-analysis.test.ts
```

需要通过代理访问 Google API 时，设置 `HTTPS_PROXY` 与 `NODE_USE_ENV_PROXY=1`（Node.js 22.21 及以上）；模型接口不走代理时，把它的域名加入 `NO_PROXY`。
