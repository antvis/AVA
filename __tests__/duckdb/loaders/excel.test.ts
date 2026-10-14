/**
 * Unit tests for src/duckdb/loaders/excel.ts
 * Uses __tests__/datasets/sales.xlsx, generated from sales.csv (Sales + Costs).
 */

import * as path from 'path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import AdmZip from 'adm-zip';
import { describe, it, expect, afterEach } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

describe('loaders/excel', () => {
  let engine: DuckDBEngine | null = null;
  const xlsxPath = path.join(__dirname, '../../datasets/sales.xlsx');

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('loads both sheets with complete schemas and queryable data', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    const schema = await engine.load({ type: 'excel', options: { path: xlsxPath } });

    expect(schema).toEqual({
      tables: [
        {
          name: 'Costs',
          columnCount: 2,
          fields: [
            { name: 'order_id', type: 'VARCHAR', nullable: true },
            { name: 'cost', type: 'DOUBLE', nullable: true },
          ],
          indexes: [],
        },
        {
          name: 'Sales',
          columnCount: 12,
          fields: [
            { name: 'order_id', type: 'VARCHAR', nullable: true },
            { name: 'order_date', type: 'DATE', nullable: true },
            { name: 'region', type: 'VARCHAR', nullable: true },
            { name: 'category', type: 'VARCHAR', nullable: true },
            { name: 'product', type: 'VARCHAR', nullable: true },
            { name: 'channel', type: 'VARCHAR', nullable: true },
            { name: 'quantity', type: 'DOUBLE', nullable: true },
            { name: 'unit_price', type: 'DOUBLE', nullable: true },
            { name: 'discount', type: 'DOUBLE', nullable: true },
            { name: 'sales', type: 'DOUBLE', nullable: true },
            { name: 'cost', type: 'DOUBLE', nullable: true },
            { name: 'profit', type: 'DOUBLE', nullable: true },
          ],
          indexes: [],
        },
      ],
      relations: [],
    });

    const sales = await engine.execute('SELECT * FROM "Sales" ORDER BY order_id', { maxRows: 240 });
    expect(sales.data).toHaveLength(240);
    expect(sales.data[0]).toEqual({
      order_id: 'ORD-0001',
      order_date: '2025-01-01',
      region: 'East',
      category: 'Electronics',
      product: 'Monitor',
      channel: 'Retail',
      quantity: 1,
      unit_price: 249,
      discount: 0.1,
      sales: 224.1,
      cost: 165,
      profit: 59.1,
    });
    expect(sales.data[239]).toMatchObject({ order_id: 'ORD-0240', order_date: '2025-12-31' });

    const costs = await engine.execute('SELECT * FROM "Costs" ORDER BY order_id', { maxRows: 240 });
    expect(costs.data).toHaveLength(240);
    expect(costs.data[0]).toEqual({ order_id: 'ORD-0001', cost: 165 });
    expect(costs.data[239]).toEqual({ order_id: 'ORD-0240', cost: 520 });
  });

  it('supports joining across sheets', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({ type: 'excel', options: { path: xlsxPath } });

    const rows = await engine.execute(
      `SELECT s.order_id, ROUND(s.sales - c.cost, 2) AS profit
       FROM "Sales" s JOIN "Costs" c USING (order_id) ORDER BY s.order_id`,
      { maxRows: 240 }
    );
    expect(rows.data).toHaveLength(240);
    expect(rows.data.slice(0, 3)).toEqual([
      { order_id: 'ORD-0001', profit: 59.1 },
      { order_id: 'ORD-0002', profit: 260.2 },
      { order_id: 'ORD-0003', profit: 376.2 },
    ]);
  });

  it('only exposes the selected sheet and inclusive range', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    const schema = await engine.load({
      type: 'excel',
      options: {
        path: xlsxPath,
        sheets: [{ name: 'Sales', range: 'A1:B3', header: true }],
      },
    });
    expect(schema.tables.map((table) => table.name)).toEqual(['Sales']);
    expect(schema.tables[0].fields.map((field) => field.name)).toEqual(['order_id', 'order_date']);
    expect((await engine.execute('SELECT * FROM "Sales"')).data).toHaveLength(2);
    await expect(engine.execute('SELECT * FROM "Costs"')).rejects.toThrow();
  });

  it('does not consume the first data row when header is false', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({
      type: 'excel',
      options: {
        path: xlsxPath,
        sheets: [{ name: 'Costs', range: 'A2:B3', header: false }],
      },
    });
    const result = await engine.execute('SELECT * FROM "Costs"');
    expect(result.data.map((row) => Object.values(row))).toEqual([
      ['ORD-0001', 165],
      ['ORD-0002', 420],
    ]);
  });

  it.each([
    { sheets: [] },
    { sheets: [{ name: 'Missing' }] },
    { sheets: [{ name: 'Sales', range: 'B3:A1' }] },
    { sheets: [{ name: 'Sales', range: 'A0:B3' }] },
  ])('rejects invalid selection %j instead of reading all sheets', async (selection) => {
    engine = new DuckDBEngine(getLLMConfig());
    await expect(engine.load({ type: 'excel', options: { path: xlsxPath, ...selection } })).rejects.toThrow();
  });

  it.each([
    ['销售 & "收入"', '销售 &amp; &quot;收入&quot;'],
    ["O'Brien <2026>", 'O&apos;Brien &lt;2026&gt;'],
    ['销售 & 😀', '&#x9500;&#21806; &amp; &#x1F600;'],
  ])('decodes XML sheet name %s exactly once', async (name, encoded) => {
    const directory = await mkdtemp(path.join(tmpdir(), 'ava-excel-'));
    try {
      const zip = new AdmZip(xlsxPath);
      const xml = zip
        .readAsText('xl/workbook.xml')
        .replace('name="Sales"', `name='${encoded}'`)
        .replace('<sheets>', '<!-- <sheet name="Not a sheet"/> --><sheets>');
      zip.updateFile('xl/workbook.xml', Buffer.from(xml));
      const file = path.join(directory, 'names.xlsx');
      zip.writeZip(file);
      engine = new DuckDBEngine(getLLMConfig());
      const schema = await engine.load({ type: 'excel', options: { path: file, sheets: [{ name }] } });
      expect(schema.tables.map((table) => table.name)).toEqual([name]);
      expect((await engine.execute(`SELECT * FROM "${name.replace(/"/g, '""')}" LIMIT 1`)).data).toHaveLength(1);
    } finally {
      await engine?.dispose();
      engine = null;
      await rm(directory, { recursive: true, force: true });
    }
  });

  it.each(['Sales &amp; Tax', 'Sales & Tax'])('rejects ambiguous workbooks when selecting %s', async (sheet) => {
    const directory = await mkdtemp(path.join(tmpdir(), 'ava-excel-'));
    try {
      const zip = new AdmZip(xlsxPath);
      const xml = zip
        .readAsText('xl/workbook.xml')
        .replace('name="Sales"', 'name="Sales &amp;amp; Tax"')
        .replace('name="Costs"', 'name="Sales &amp; Tax"');
      zip.updateFile('xl/workbook.xml', Buffer.from(xml));
      const file = path.join(directory, 'names.xlsx');
      zip.writeZip(file);
      engine = new DuckDBEngine(getLLMConfig());
      await expect(engine.load({ type: 'excel', options: { path: file, sheets: [{ name: sheet }] } })).rejects.toThrow(
        'cannot safely read Excel sheet'
      );
    } finally {
      await engine?.dispose();
      engine = null;
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('throws for a non-xlsx file', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await expect(
      engine.load({ type: 'excel', options: { path: path.join(__dirname, '../../../data/companies.csv') } })
    ).rejects.toThrow();
  });
});
