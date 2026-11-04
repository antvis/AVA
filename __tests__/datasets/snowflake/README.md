# Snowflake 测试库

供 `__tests__/remote/snowflake/integration.test.ts`（schema、只读校验、取值、profile、超时与资源释放）和 `__tests__/cases/snowflake-tpch-analysis.test.ts`（端到端自然语言分析）使用。测试默认跳过，仅在 `AVA_SNOWFLAKE_TEST=1` 时执行，需要一个 Snowflake 账号，免费试用账号即可。

## 准备账号（一次）

1. 生成两对 RSA 密钥，分别给只读用户和测试数据的所有者：

   ```sh
   openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out ava_reader_key.p8 -nocrypt
   openssl rsa -in ava_reader_key.p8 -pubout -out ava_reader_key.pub
   openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out ava_owner_key.p8 -nocrypt
   openssl rsa -in ava_owner_key.p8 -pubout -out ava_owner_key.pub
   ```

2. 把 `setup.sql` 里的 `<READER_PUBLIC_KEY>` 和 `<OWNER_PUBLIC_KEY>` 替换为公钥正文（去掉 BEGIN/END 行，合成一行），以 `ACCOUNTADMIN` 在 Snowsight 工作表中 Run All。脚本会创建：
   - X-Small 仓库 `AVA_WH`，每月 20 credits 上限；
   - 只读角色 `AVA_READER` 和服务用户 `AVA_READER_SVC`；
   - 测试库所有者 `AVA_OWNER` 和 `AVA_OWNER_SVC`；
   - 测试库 `AVA_TEST`；
   - 并为只读角色授权共享样例库 `SNOWFLAKE_SAMPLE_DATA`。

   两个服务用户都用密钥对登录，不需要密码，也不会触发 MFA。

3. 以 `AVA_OWNER` 执行 `init.sql` 创建测试数据：在 Snowsight 中切换到该角色后 Run All，或用 Snowflake CLI 执行 `snow sql -f init.sql`。`SALES` schema 授权给只读角色；`PRIVATE` schema 不授权，用来验证“只能看到授权范围内的表”。修改 `init.sql` 后直接重跑即可，脚本会重建这两个 schema。

## 运行

```sh
export AVA_SNOWFLAKE_TEST=1
export AVA_SNOWFLAKE_ACCOUNT=<orgname>-<account_name>
export AVA_SNOWFLAKE_USER=AVA_READER_SVC
export AVA_SNOWFLAKE_PRIVATE_KEY_PATH=/path/to/ava_reader_key.p8
export AVA_SNOWFLAKE_WAREHOUSE=AVA_WH
export AVA_SNOWFLAKE_ROLE=AVA_READER

npx vitest run __tests__/remote/snowflake

# 端到端分析用例还需要模型配置：OPENAI_API_KEY、OPENAI_MODEL，以及可选的 OPENAI_BASE_URL
npx vitest run __tests__/cases/snowflake-tpch-analysis.test.ts
```

不使用密钥对时，可改为设置 `AVA_SNOWFLAKE_TOKEN`（programmatic access token）或 `AVA_SNOWFLAKE_PASSWORD`。

端到端用例在 `SNOWFLAKE_SAMPLE_DATA.TPCH_SF1` 上提问，并把结果与 TPC-H 官方答案（Q1、Q5、Q6，规模因子 1）比对。查询会消耗仓库 credits；`AVA_WH` 空闲 60 秒后自动挂起。
