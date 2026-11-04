# SQL Server 测试库

这里的 Compose 配置和初始化数据供 SQL Server engine 的 schema、execute、profile 与 CLI 集成测试使用。测试默认跳过，仅在 `AVA_SQLSERVER_TEST=1` 时执行，且不会自动启动数据库。

## 运行

```sh
open -a OrbStack
docker info
docker compose -f __tests__/datasets/sqlserver/compose.yaml up -d --wait

AVA_SQLSERVER_TEST=1 npx vitest run __tests__/remote/sqlserver
```

默认连接 `127.0.0.1:11433`。修改端口时，Compose 和测试须设置相同的 `AVA_SQLSERVER_TEST_PORT`。Apple Silicon 需启用 Docker 环境的 Rosetta 支持。

暂停测试库并保留数据：

```sh
docker compose -f __tests__/datasets/sqlserver/compose.yaml stop
```

修改 `init.sql` 后需删除数据卷并重建：

```sh
docker compose -f __tests__/datasets/sqlserver/compose.yaml down -v
docker compose -f __tests__/datasets/sqlserver/compose.yaml up -d --wait
```
