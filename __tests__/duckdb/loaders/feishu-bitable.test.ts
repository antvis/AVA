/**
 * Feishu Bitable source end to end: the mock Open API serves the sales demo base,
 * AVA loads it into DuckDB, and the schema and query results are checked against
 * values computed independently from the raw fixture.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../../../src';

import { mockFeishu, salesBase } from './feishu-mock';

import type { FeishuBitableSourceOptions } from '../../../src/types';

const BASE_URL = 'https://acme.feishu.cn/base/bascnSalesDemo0000000000';
const app = { appId: 'cli_test', appSecret: 'secret' };
const fixture = salesBase();
const [customers, products, orders] = fixture.tables;

/** Beijing calendar day of a Feishu timestamp, computed without the loader's helpers. */
const beijingDay = (ms: number) => new Date(ms + 8 * 3600 * 1000).toISOString().slice(0, 10);
const amount = (record: (typeof orders.records)[number]) => (record.fields['金额'] as { value: number[] }).value[0];
const round = (value: number) => Math.round(value * 100) / 100;

let ava: AVA | undefined;

async function load(options: FeishuBitableSourceOptions) {
  ava = new AVA({ llm: { model: 'no-model-call' } });
  await ava.source({ type: 'feishu-bitable', options });
  return ava;
}

afterEach(async () => {
  await ava?.dispose();
  ava = undefined;
  vi.unstubAllGlobals();
});

describe('feishu-bitable: whole base', () => {
  it('loads every table with typed columns, record_id keys and link relationships', async () => {
    mockFeishu(salesBase());
    const schema = await (await load({ url: BASE_URL, ...app })).schema();

    expect(schema.models.map((model) => model.name).sort()).toEqual(['商品', '客户', '订单'].sort());
    for (const model of schema.models) expect(model.primaryKey).toBe('record_id');

    const columns = Object.fromEntries(
      schema.models.find((model) => model.name === '订单')!.columns.map((column) => [column.name, column.type])
    );
    expect(columns).toEqual({
      record_id: 'VARCHAR',
      订单号: 'VARCHAR',
      客户: 'VARCHAR',
      客户_record_id: 'VARCHAR',
      商品: 'VARCHAR',
      商品_record_id: 'VARCHAR',
      数量: 'DOUBLE',
      金额: 'DOUBLE',
      单价: 'DOUBLE',
      下单日期: 'DATE',
      发货时间: 'TIMESTAMP',
      状态: 'VARCHAR',
      标签: 'VARCHAR[]',
      已付款: 'BOOLEAN',
      序号: 'BIGINT',
      备注: 'VARCHAR',
    });
    // The back link of a duplex link holds several orders per customer, so it stays a list.
    expect(schema.models.find((model) => model.name === '客户')!.columns).toContainEqual(
      expect.objectContaining({ name: '订单', type: 'VARCHAR[]' })
    );
    expect(schema.relationships).toEqual([
      {
        name: '订单.客户',
        models: ['订单', '客户'],
        joinType: 'MANY_TO_ONE',
        condition: '"订单"."客户_record_id" = "客户"."record_id"',
      },
      {
        name: '订单.商品',
        models: ['订单', '商品'],
        joinType: 'MANY_TO_ONE',
        condition: '"订单"."商品_record_id" = "商品"."record_id"',
      },
    ]);
  });

  it('reads dates in the base time zone, so month totals match Feishu', async () => {
    mockFeishu(salesBase());
    const result = await (
      await load({ url: BASE_URL, ...app })
    ).query(
      "SELECT strftime(下单日期, '%Y-%m') AS month, round(SUM(金额), 2) AS total FROM 订单 GROUP BY 1 ORDER BY 1"
    );

    const expected = new Map<string, number>();
    for (const record of orders.records) {
      const month = beijingDay(record.fields['下单日期'] as number).slice(0, 7);
      expected.set(month, round((expected.get(month) ?? 0) + amount(record)));
    }
    expect(result.data).toEqual([...expected].map(([month, total]) => ({ month, total })));
    // Every month has orders on the 1st at 00:00 Beijing time, i.e. the previous day in UTC.
    const firsts = orders.records
      .map((record) => beijingDay(record.fields['下单日期'] as number))
      .filter((day) => day.endsWith('-01'));
    expect(new Set(firsts.map((day) => day.slice(0, 7))).size).toBe(6);
  });

  it('keeps wall-clock times for date-time fields', async () => {
    mockFeishu(salesBase());
    const record = orders.records.find((item) => item.fields['发货时间'] !== undefined)!;
    const shipped = new Date((record.fields['发货时间'] as number) + 8 * 3600 * 1000).toISOString();
    const result = await (
      await load({ url: BASE_URL, ...app })
    ).query(`SELECT strftime(发货时间, '%Y-%m-%dT%H:%M') AS shipped FROM 订单 WHERE record_id = '${record.record_id}'`);

    expect(result.data).toEqual([{ shipped: shipped.slice(0, 16) }]);
  });

  it('joins orders to customers through the declared relationship', async () => {
    mockFeishu(salesBase());
    const result = await (
      await load({ url: BASE_URL, ...app })
    ).query(
      `SELECT c.城市 AS city, round(SUM(o.金额), 2) AS total
       FROM 订单 o JOIN 客户 c ON o.客户_record_id = c.record_id GROUP BY 1 ORDER BY 1`
    );

    const city = new Map(customers.records.map((record) => [record.record_id, record.fields['城市'] as string]));
    const expected = new Map<string, number>();
    for (const record of orders.records) {
      const customer = (record.fields['客户'] as { link_record_ids: string[] }).link_record_ids[0];
      expected.set(city.get(customer)!, round((expected.get(city.get(customer)!) ?? 0) + amount(record)));
    }
    const sorted = [...expected].sort(([a], [b]) => (a < b ? -1 : 1));
    expect(result.data).toEqual(sorted.map(([city, total]) => ({ city, total })));
  });

  it('shows linked records by their primary field', async () => {
    mockFeishu(salesBase());
    const result = await (
      await load({ url: BASE_URL, ...app })
    ).query("SELECT 客户, 商品 FROM 订单 WHERE record_id = 'recOrder001'");

    const record = orders.records[0];
    const name = (table: typeof customers, id: string) =>
      (table.records.find((item) => item.record_id === id)!.fields[table.fields[0].field_name] as { text: string }[])[0]
        .text;
    expect(result.data).toEqual([
      {
        客户: name(customers, (record.fields['客户'] as { link_record_ids: string[] }).link_record_ids[0]),
        商品: name(products, (record.fields['商品'] as { link_record_ids: string[] }).link_record_ids[0]),
      },
    ]);
  });

  it('treats an unchecked checkbox as false and filters multi-select lists exactly', async () => {
    mockFeishu(salesBase());
    const ava = await load({ url: BASE_URL, ...app });
    const unpaid = await ava.query('SELECT COUNT(*) AS n FROM 订单 WHERE NOT 已付款');
    const urgent = await ava.query("SELECT COUNT(*) AS n FROM 订单 WHERE list_contains(标签, '加急')");

    expect(unpaid.data).toEqual([{ n: orders.records.filter((record) => record.fields['已付款'] !== true).length }]);
    expect(urgent.data).toEqual([
      { n: orders.records.filter((record) => ((record.fields['标签'] as string[]) ?? []).includes('加急')).length },
    ]);
  });
  it('profiles every table, including list columns', async () => {
    mockFeishu(salesBase());
    const profile = await (await load({ url: BASE_URL, ...app })).profile();

    const model = profile.models.find((item) => item.name === '订单')!;
    expect(model.metrics.row_count).toBe(orders.records.length);
    const column = (name: string) => model.columns.find((item) => item.name === name)!;
    expect(column('下单日期').properties.logicalType).toBe('date');
    expect(column('已付款').metrics.null_count).toBe(0);
    expect(column('标签').properties.logicalType).toBe('unknown');
    expect(column('标签').metrics.null_count).toBe(
      orders.records.filter((record) => record.fields['标签'] === undefined).length
    );
  });
});

describe('feishu-bitable: several sources', () => {
  it('keeps the tables and their relationships inside the source namespace', async () => {
    mockFeishu(salesBase());
    ava = new AVA({ llm: { model: 'no-model-call' } });
    await ava.source([
      { name: 'sales', type: 'feishu-bitable', options: { url: BASE_URL, ...app } },
      { name: 'targets', type: 'json', options: { data: [{ city: '上海', target: 100000 }] } },
    ]);
    const schema = await ava.schema();

    expect(schema.models.map((model) => model.name).sort()).toEqual(
      ['sales.商品', 'sales.客户', 'sales.订单', 'targets.data'].sort()
    );
    expect(schema.relationships).toContainEqual({
      name: 'sales.订单.客户',
      models: ['sales.订单', 'sales.客户'],
      joinType: 'MANY_TO_ONE',
      condition: '"sales"."订单"."客户_record_id" = "sales"."客户"."record_id"',
    });

    const shanghai = new Set(
      customers.records.filter((record) => record.fields['城市'] === '上海').map((record) => record.record_id)
    );
    const expected = round(
      orders.records
        .filter((record) => shanghai.has((record.fields['客户'] as { link_record_ids: string[] }).link_record_ids[0]))
        .reduce((sum, record) => sum + amount(record), 0)
    );
    const result = await ava.query(
      `SELECT c.城市 AS city, t.target, round(SUM(o.金额), 2) AS total
       FROM sales.订单 o JOIN sales.客户 c ON o.客户_record_id = c.record_id JOIN targets.data t ON t.city = c.城市
       GROUP BY 1, 2`
    );
    expect(result.data).toEqual([{ city: '上海', target: 100000, total: expected }]);
  });
});

describe('feishu-bitable: one table', () => {
  it('exposes the table named in the link as data, labelling links from the linked tables', async () => {
    const { requests } = mockFeishu(salesBase());
    const ava = await load({ url: `${BASE_URL}?table=tblOrders&view=vewUnpaid`, ...app });
    const schema = await ava.schema();

    expect(schema.models.map((model) => model.name)).toEqual(['data']);
    expect(schema.relationships ?? []).toEqual([]);
    expect(schema.models[0].columns.map((column) => column.name)).not.toContain('客户_record_id');
    // The view in a copied link does not filter the rows.
    const count = await ava.query('SELECT COUNT(*) AS n, COUNT(DISTINCT 客户) AS customers FROM data');
    expect(count.data).toEqual([{ n: orders.records.length, customers: customers.records.length }]);
    // Linked tables are read with their primary field only.
    const linked = requests.filter((request) => request.url.pathname.includes('/tblCustomers/records/search'));
    expect(linked.map((request) => request.body)).toEqual([{ field_names: ['客户名称'] }]);
  });

  it('loads only the records of viewId', async () => {
    mockFeishu(salesBase());
    const ava = await load({ url: `${BASE_URL}?table=tblOrders`, viewId: 'vewUnpaid', ...app });
    const result = await ava.query('SELECT bool_or(已付款) AS paid, COUNT(*) AS n FROM data');

    expect(result.data).toEqual([{ paid: false, n: orders.views!.vewUnpaid.length }]);
  });

  it('rejects viewId without a table', async () => {
    mockFeishu(salesBase());
    await expect(load({ url: BASE_URL, viewId: 'vewUnpaid', ...app })).rejects.toThrow('viewId needs a table');
  });

  it('honours an explicit timeZone', async () => {
    mockFeishu(salesBase());
    const ava = await load({ url: `${BASE_URL}?table=tblOrders`, timeZone: 'UTC', ...app });
    const result = await ava.query("SELECT 下单日期 AS day FROM data WHERE record_id = 'recOrder001'");

    // 2024-01-01 00:00 in Beijing is still 2023-12-31 in UTC.
    expect(result.data).toEqual([{ day: '2023-12-31' }]);
  });
});

describe('feishu-bitable: credentials', () => {
  it('uses an access token from the host application as is', async () => {
    const { requests } = mockFeishu(salesBase());
    await load({
      url: 'https://acme.larksuite.com/base/bascnSalesDemo0000000000?table=tblProducts',
      accessToken: 'u-1',
    });

    expect(new Set(requests.map((request) => request.url.origin))).toEqual(new Set(['https://open.larksuite.com']));
    expect(new Set(requests.map((request) => request.authorization))).toEqual(new Set(['Bearer u-1']));
  });

  it.each([
    [{}, 'requires appId and appSecret, or accessToken'],
    [{ appId: 'id' }, 'requires both appId and appSecret'],
    [{ ...app, accessToken: 'u-1' }, 'accepts one credential, got app and accessToken'],
  ])('rejects credentials %j before any request', async (credentials, message) => {
    const { requests } = mockFeishu(salesBase());
    await expect(load({ url: BASE_URL, ...credentials })).rejects.toThrow(message);
    expect(requests).toEqual([]);
  });
});

describe('feishu-bitable: reading', () => {
  it('retries rate limits and keeps every page', async () => {
    const base = salesBase();
    // 2: app, 3: tables, 4: fields; the first records page is rate limited once.
    const { requests } = mockFeishu(base, { responses: { 5: { body: { code: 1254290, msg: 'TooManyRequest' } } } });
    const result = await (
      await load({ url: `${BASE_URL}?table=tblOrders`, ...app })
    ).query('SELECT COUNT(*) AS n FROM data');

    expect(result.data).toEqual([{ n: orders.records.length }]);
    expect(requests.filter((request) => request.url.pathname.endsWith('/tblOrders/records/search'))).toHaveLength(2);
  });

  it('fails when the pages do not add up to the reported total', async () => {
    mockFeishu(salesBase(), {
      recordsPage: (page, table) => (table.table_id === 'tblOrders' ? { ...page, total: 999 } : page),
    });
    await expect(load({ url: `${BASE_URL}?table=tblOrders`, ...app })).rejects.toThrow(
      `reported 999 records but returned ${orders.records.length}`
    );
  });

  it('passes Feishu errors through with their code', async () => {
    mockFeishu(salesBase());
    await expect(load({ url: `${BASE_URL}?table=tblMissing`, ...app })).rejects.toThrow(
      'Feishu Error 1254041: TableIdNotFound'
    );
  });
});
