/**
 * Unit tests for src/duckdb/loaders/excel.ts
 * Uses __tests__/datasets/sales.xlsx, generated from sales.csv (Sales + Costs).
 */

import * as path from 'path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import AdmZip from 'adm-zip';
import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

import type { ExcelSourceOptions } from '../../../src/types';

describe('loaders/excel', () => {
  let engine: DuckDBEngine | null = null;
  const xlsxPath = path.join(__dirname, '../../datasets/sales.xlsx');

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('loads both sheets with complete schemas and queryable data', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({ type: 'excel', options: { path: xlsxPath } });
    const schema = await engine.schema();

    expect(schema).toEqual({
      models: [
        {
          name: 'Costs',
          columns: [
            { name: 'order_id', type: 'VARCHAR', notNull: false },
            { name: 'cost', type: 'DOUBLE', notNull: false },
          ],
          tableReference: { catalog: 'memory', schema: 'main', table: 'Costs' },
        },
        {
          name: 'Sales',
          columns: [
            { name: 'order_id', type: 'VARCHAR', notNull: false },
            { name: 'order_date', type: 'DATE', notNull: false },
            { name: 'region', type: 'VARCHAR', notNull: false },
            { name: 'category', type: 'VARCHAR', notNull: false },
            { name: 'product', type: 'VARCHAR', notNull: false },
            { name: 'channel', type: 'VARCHAR', notNull: false },
            { name: 'quantity', type: 'DOUBLE', notNull: false },
            { name: 'unit_price', type: 'DOUBLE', notNull: false },
            { name: 'discount', type: 'DOUBLE', notNull: false },
            { name: 'sales', type: 'DOUBLE', notNull: false },
            { name: 'cost', type: 'DOUBLE', notNull: false },
            { name: 'profit', type: 'DOUBLE', notNull: false },
          ],
          tableReference: { catalog: 'memory', schema: 'main', table: 'Sales' },
        },
      ],
      relationships: [],
      views: schema.models.map(({ name }) => ({ name, statement: expect.any(String) })),
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
    await engine.load({
      type: 'excel',
      options: { path: xlsxPath, sheets: [{ sheet: 'Sales', range: 'A1:B3', header: true }] },
    });
    const schema = await engine.schema();
    expect(schema.models.map((table) => table.name)).toEqual(['Sales']);
    expect(schema.models[0].columns.map((field) => field.name)).toEqual(['order_id', 'order_date']);
    expect((await engine.execute('SELECT * FROM "Sales"')).data).toHaveLength(2);
    await expect(engine.execute('SELECT * FROM "Costs"')).rejects.toThrow();
  });

  it('does not consume the first data row when header is false', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({
      type: 'excel',
      options: { path: xlsxPath, sheets: [{ sheet: 'Costs', range: 'A2:B3', header: false }] },
    });
    const result = await engine.execute('SELECT * FROM "Costs"');
    expect(result.data.map((row) => Object.values(row))).toEqual([
      ['ORD-0001', 165],
      ['ORD-0002', 420],
    ]);
  });

  it.each([
    { sheets: [] },
    { sheets: [{ sheet: 'Missing' }] },
    { sheets: [{ sheet: 'Sales', range: 'B3:A1' }] },
    { sheets: [{ sheet: 'Sales', range: 'A0:B3' }] },
    { sheets: [{ sheet: 'Sales', range: 'A1:XFE3' }] },
    { sheets: [{ sheet: 'Sales', range: 'A1:A1048577' }] },
    { sheets: [{ sheet: 'Sales', range: 'Sales!A1:B3' }] },
    { sheets: [{ sheet: 'Sales' }, { sheet: 'Sales', header: false }] },
  ])('rejects invalid selection %j instead of reading all sheets', async (selection) => {
    engine = new DuckDBEngine(getLLMConfig());
    await expect(engine.load({ type: 'excel', options: { path: xlsxPath, ...selection } })).rejects.toThrow();
  });

  it.each([
    { sheets: ['Sales'] },
    { sheets: [{ sheet: 'Sales', all_varchar: 'true' }] },
    { range: 'A1:B3' },
    { header: false },
    { skip: 2 },
  ])('rejects obsolete or unsupported configuration %j', async (options) => {
    engine = new DuckDBEngine(getLLMConfig());
    await expect(
      engine.load({ type: 'excel', options: { path: xlsxPath, ...options } as ExcelSourceOptions })
    ).rejects.toThrow();
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
      await engine.load({ type: 'excel', options: { path: file, sheets: [{ sheet: name }] } });
      const schema = await engine.schema();
      expect(schema.models.map((table) => table.name)).toEqual([name]);
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
      await expect(engine.load({ type: 'excel', options: { path: file, sheets: [{ sheet }] } })).rejects.toThrow(
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
  describe('per-sheet read settings', () => {
    let directory: string;
    let file: string;
    beforeAll(async () => {
      directory = await mkdtemp(path.join(tmpdir(), 'ava-excel-selection-'));
      file = path.join(directory, 'selection.xlsx');
      const zip = new AdmZip(path.join(__dirname, '../../datasets/sales.xlsx'));
      zip.updateFile(
        'xl/worksheets/sheet1.xml',
        Buffer.from(`<?xml version="1.0"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
<row r="1"><c r="A1" t="inlineStr"><is><t>Report title</t></is></c></row>
<row r="3"><c r="B3"><v>101</v></c><c r="C3"><v>202</v></c></row>
<row r="4"><c r="B4"><v>1</v></c><c r="C4"><v>2</v></c></row>
<row r="6"><c r="B6"><v>3</v></c><c r="C6"><v>4</v></c></row>
<row r="7"><c r="B7" t="inlineStr"><is><t>Private notes</t></is></c></row>
</sheetData></worksheet>`)
      );
      zip.writeZip(file);
    });
    afterAll(async () => {
      await rm(directory, { recursive: true, force: true });
    });

    it.each([true, false])('supports normalize_names=%s for sheet headers', async (normalize_names) => {
      engine = new DuckDBEngine(getLLMConfig());
      await engine.load({
        type: 'excel',
        options: { path: file, sheets: [{ sheet: 'Sales', range: 'A1:A2', normalize_names }] },
      });
      expect((await engine.schema()).models[0].columns.map(({ name }) => name)).toEqual([
        normalize_names ? 'report_title' : 'Report title',
      ]);
    });

    it.each([undefined, true, false])('respects range, blank rows, and header=%s', async (header) => {
      const instance = new DuckDBEngine(getLLMConfig());
      try {
        const options: ExcelSourceOptions = { path: file, sheets: [{ sheet: 'Sales', range: 'b3:c6', header }] };
        await instance.load({ type: 'excel', options });
        const schema = await instance.schema();
        expect(schema.models.map((table) => table.name)).toEqual(['Sales']);
        if (header !== false) expect(schema.models[0].columns.map((field) => field.name)).toEqual(['101', '202']);
        const result = await instance.execute('SELECT * FROM "Sales"');
        expect(result.data.map((row) => Object.values(row))).toEqual([
          ...(header === false ? [[101, 202]] : []),
          [1, 2],
          [null, null],
          [3, 4],
        ]);
      } finally {
        await instance.dispose();
      }
    });

    it.each([true, false])('supports stop_at_empty=%s within a range', async (stop_at_empty) => {
      engine = new DuckDBEngine(getLLMConfig());
      await engine.load({
        type: 'excel',
        options: { path: file, sheets: [{ sheet: 'Sales', range: 'B3:C6', stop_at_empty }] },
      });
      const result = await engine.execute('SELECT * FROM "Sales"');
      expect(result.data.map((row) => Object.values(row))).toEqual(
        stop_at_empty
          ? [[1, 2]]
          : [
              [1, 2],
              [null, null],
              [3, 4],
            ]
      );
    });

    it('reads mixed types as strings with all_varchar', async () => {
      engine = new DuckDBEngine(getLLMConfig());
      await engine.load({
        type: 'excel',
        options: { path: file, sheets: [{ sheet: 'Sales', range: 'B3:C7', all_varchar: true }] },
      });
      const schema = await engine.schema();
      expect(schema.models[0].columns.map((field) => field.type)).toEqual(['VARCHAR', 'VARCHAR']);
      const result = await engine.execute('SELECT * FROM "Sales"');
      expect(result.data.map((row) => Object.values(row))).toEqual([
        ['1', '2'],
        [null, null],
        ['3', '4'],
        ['Private notes', null],
      ]);
    });

    it.each([true, false])('supports ignore_errors=%s for incompatible cells', async (ignore_errors) => {
      engine = new DuckDBEngine(getLLMConfig());
      await engine.load({
        type: 'excel',
        options: { path: file, sheets: [{ sheet: 'Sales', range: 'B3:C7', ignore_errors }] },
      });
      const result = engine.execute('SELECT * FROM "Sales"');
      if (ignore_errors) {
        expect((await result).data.map((row) => Object.values(row))).toEqual([
          [1, 2],
          [null, null],
          [3, 4],
          [null, null],
        ]);
      } else {
        await expect(result).rejects.toThrow();
      }
    });

    it.each([true, false])(
      'supports empty_as_varchar=%s for an empty cell in the first data row',
      async (empty_as_varchar) => {
        engine = new DuckDBEngine(getLLMConfig());
        await engine.load({
          type: 'excel',
          options: { path: file, sheets: [{ sheet: 'Sales', range: 'B7:C7', header: false, empty_as_varchar }] },
        });
        const schema = await engine.schema();
        expect(schema.models[0].columns.map((field) => field.type)).toEqual(
          empty_as_varchar ? ['VARCHAR', 'VARCHAR'] : ['VARCHAR', 'DOUBLE']
        );
      }
    );

    it('applies independent ranges and headers to two sheets', async () => {
      const instance = new DuckDBEngine(getLLMConfig());
      try {
        await instance.load({
          type: 'excel',
          options: {
            path: file,
            sheets: [
              { sheet: 'Sales', range: 'B3:C4', header: true },
              { sheet: 'Costs', range: 'A2:B3', header: false },
            ],
          },
        });
        const schema = await instance.schema();
        expect(schema.models.map((table) => table.name).sort()).toEqual(['Costs', 'Sales']);
        const sales = await instance.execute('SELECT * FROM "Sales"');
        expect(sales.data).toEqual([{ '101': 1, '202': 2 }]);
        const costs = await instance.execute('SELECT * FROM "Costs"');
        expect(costs.data.map((row) => Object.values(row))).toEqual([
          ['ORD-0001', 165],
          ['ORD-0002', 420],
        ]);
      } finally {
        await instance.dispose();
      }
    });
  });
});
