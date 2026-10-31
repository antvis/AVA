# SQL Server 测试库

这里的 Compose 配置和初始化数据供 SQL Server engine 的 schema、execute、profile 与 CLI 集成测试使用。测试默认跳过，仅在 `AVA_SQLSERVER_TEST=1` 时执行，且不会自动启动数据库。

## 运行

需使用 x86-64 Linux Docker 主机；ARM Mac 可通过 SSH 隧道连接远端测试库。SQL Server 镜像不会自动执行 `init.sql`，需手动初始化：

```sh
docker info
docker compose -f __tests__/datasets/sqlserver/compose.yaml up -d --wait
docker compose -f __tests__/datasets/sqlserver/compose.yaml exec -T sqlserver \
  bash -c 'SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -b -i /tmp/ava-init.sql'

npm run build
AVA_SQLSERVER_TEST=1 npx vitest run __tests__/remote/sqlserver
```

默认连接 `127.0.0.1:11433`。修改端口时，Compose 和测试须设置相同的 `AVA_SQLSERVER_TEST_PORT`。远端测试库可通过 `ssh -N -L 11433:127.0.0.1:11433 <host>` 转发端口。

暂停测试库并保留数据：

```sh
docker compose -f __tests__/datasets/sqlserver/compose.yaml stop
```

修改 `init.sql` 后需删除数据卷并重建，再执行上方初始化命令：

```sh
docker compose -f __tests__/datasets/sqlserver/compose.yaml down -v
docker compose -f __tests__/datasets/sqlserver/compose.yaml up -d --wait
```
