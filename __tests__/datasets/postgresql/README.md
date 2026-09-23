# PostgreSQL 测试库

这里的 Compose 配置和初始化数据供 PostgreSQL load/schema 与 profile 集成测试使用。测试默认跳过，仅在 `AVA_POSTGRESQL_TEST=1` 时执行，且不会自动启动数据库。

## 运行

```sh
open -a OrbStack
docker info
docker compose -f __tests__/datasets/postgresql/compose.yaml up -d --wait

AVA_POSTGRESQL_TEST=1 npx vitest run __tests__/duckdb/loaders/postgresql.test.ts
AVA_POSTGRESQL_TEST=1 npx vitest run __tests__/duckdb/profile/postgresql.test.ts
```

默认连接 `127.0.0.1:15432`。修改端口时，Compose 和测试须设置相同的 `AVA_POSTGRESQL_TEST_PORT`。

暂停测试库并保留数据：

```sh
docker compose -f __tests__/datasets/postgresql/compose.yaml stop
```

修改 `init.sql` 后需删除数据卷并重建：

```sh
docker compose -f __tests__/datasets/postgresql/compose.yaml down -v
docker compose -f __tests__/datasets/postgresql/compose.yaml up -d --wait
```
