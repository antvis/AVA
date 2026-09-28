# MongoDB 测试库

这里的 Compose 配置和初始化数据供 MongoDB load/schema 与 profile 集成测试使用。测试默认跳过，仅在 `AVA_MONGODB_TEST=1` 时执行，且不会自动启动数据库。

## 运行

```sh
open -a OrbStack
docker info
docker compose -f __tests__/datasets/mongodb/compose.yaml up -d --wait

AVA_MONGODB_TEST=1 npx vitest run __tests__/duckdb/loaders/mongodb.test.ts
AVA_MONGODB_TEST=1 npx vitest run __tests__/duckdb/profile/mongodb.test.ts
```

默认连接 `127.0.0.1:17017`。修改端口时，Compose 和测试须设置相同的 `AVA_MONGODB_TEST_PORT`。

暂停测试库并保留数据：

```sh
docker compose -f __tests__/datasets/mongodb/compose.yaml stop
```

修改 `init.js` 后需删除数据卷并重建：

```sh
docker compose -f __tests__/datasets/mongodb/compose.yaml down -v
docker compose -f __tests__/datasets/mongodb/compose.yaml up -d --wait
```
