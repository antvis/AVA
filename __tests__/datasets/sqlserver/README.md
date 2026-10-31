# SQL Server test database

Use an x86-64 Linux Docker host for the SQL Server 2022 fixture. On ARM macOS,
connect to that host through an SSH tunnel rather than running the image locally.

```sh
docker compose -f __tests__/datasets/sqlserver/compose.yaml up -d --wait
docker compose -f __tests__/datasets/sqlserver/compose.yaml exec -T sqlserver \
  bash -c 'SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -b -i /tmp/ava-init.sql'
npm run build
AVA_SQLSERVER_TEST=1 npx vitest run __tests__/remote/sqlserver
```

Run initialization explicitly: the SQL Server image does not run `init.sql` automatically.
It preserves existing tables. The fixture creates a SELECT-only `ava_reader` login with
VIEW DEFINITION, three customers and six orders. Its passwords are for disposable tests.
An additional `sales.orders` table exercises schema-qualified names. The `dbo.paid_orders`
view exposes the five paid orders for view discovery, querying, and profiling tests. Re-run initialization when reusing an older fixture; the view integration test is skipped until this view exists.

For a remote host, forward port 11433 with `ssh -N -L 11433:127.0.0.1:11433 <host>`.
Override connections through `AVA_SQLSERVER_TEST_HOST`, `AVA_SQLSERVER_TEST_PORT`,
`AVA_SQLSERVER_TEST_DATABASE`, `AVA_SQLSERVER_TEST_USER`, and `AVA_SQLSERVER_TEST_PASSWORD`.
Without `AVA_SQLSERVER_TEST=1`, live tests are skipped. Model tests additionally require
`OPENAI_API_KEY`, `OPENAI_MODEL`, and optionally `OPENAI_BASE_URL` in the environment or `.env`.

## Natural-language examples

Use the fixture with the Node.js SDK:

```typescript
import { AVA } from '@antv/ava';

const ava = new AVA({
  llm: {
    model: process.env.OPENAI_MODEL!,
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  },
  engine: { type: 'sqlserver' },
});
try {
  await ava.source({
    type: 'sqlserver',
    options: {
      host: '127.0.0.1',
      port: 11433,
      database: 'ava_sqlserver_test',
      user: 'ava_reader',
      password: process.env.AVA_SQLSERVER_TEST_PASSWORD ?? 'Ava_reader_test_2026!',
      schema: 'dbo',
      trustServerCertificate: true, // Only for this self-signed test fixture.
    },
  });
  console.dir(await ava.profile({ metrics: ['row_count', 'null_count', 'mean'] }), { depth: null });
  const monthly = await ava.analyze(
    "按月份汇总 dbo.orders 中 status='paid' 的金额，输出 month（YYYY-MM）和 total_amount，按月份升序。"
  );
  console.table(monthly.data);
  const customers = await ava.analyze(
    "按 customer_id 升序列出 dbo.customers 中所有客户在 dbo.orders 的已支付订单总额，没有已支付订单的客户计0，输出 customer_id、customer_name、total_amount。"
  );
  console.table(customers.data);
} finally {
  await ava.dispose();
}
```

| Example | Expected result |
| --- | --- |
| Paid amount by month | 2025-01: 450.75; 2025-02: 380.00 |
| Paid amount by customer | 张三: 380.50; Alice: 450.25; 李四: 0.00 |

For the CLI, save the same source configuration as `sqlserver.json`. Set model
variables before loading, then use the returned dataset ID:

```sh
ava source @sqlserver.json
ava schema <dataset-id>
ava profile <dataset-id> --metrics row_count,null_count,mean
ava analyze <dataset-id> "按月份汇总 dbo.orders 已支付金额，输出 month 和 total_amount，按月份升序。"
ava analyze <dataset-id> "按 customer_id 升序列出所有客户已支付金额，没有订单计0，输出 customer_id、customer_name、total_amount。"
ava dispose <dataset-id>
```

The tests cover connection cleanup, schema/keys, profiling, single read-only T-SQL,
result limits, query errors/timeouts, and the actual SDK/CLI workflows. Both analysis examples compare
real query results with the expected values above. Supported connections use SQL
authentication. `profile()` supports the shared built-in metrics for applicable field
types, using native T-SQL on the server. Omitting `metrics` uses the standard defaults;
a supplied list replaces them, and `top_values` accepts `limit` and `maxDistinctRatio`.
TLS validates certificates by default.

Queries use the T-SQL grammar provided by `antlr4ts-sql`, including TOP, CTEs, joins,
aggregates, UNION, and OFFSET/FETCH. Validation requires one SELECT and rejects
SELECT INTO. Use a read-only database login to enforce database permissions.

To stop while preserving data, run `docker compose -f __tests__/datasets/sqlserver/compose.yaml stop`.
To reset this disposable fixture, use `down -v`, then repeat startup and initialization.

## AI usage

AI assisted with implementation, test cases and documentation. Verification uses executed
unit tests and real SQL Server SDK/CLI queries; model-generated results are checked against
fixed expectations. Tested with Node.js 24.1, SQL Server 2022 CU27-GDR1 and DeepSeek Flash.
