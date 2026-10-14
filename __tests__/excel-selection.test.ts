import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import AdmZip from 'adm-zip';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DuckDBEngine } from '../src/duckdb/engine';
import { PythonEngine } from '../src/interpreter/python/engine';
import { createPythonExecutor } from '../src/interpreter/python/util/execute';

import type { ExcelSourceOptions } from '../src/types';

// Both engines read the same workbook; opt in where pandas and openpyxl are installed.
for (const kind of ['duckdb', 'python'] as const) {
  describe.skipIf(kind === 'python' && process.env.AVA_PYTHON_LOCAL_TEST !== '1')(`Excel selection (${kind})`, () => {
    let directory: string;
    let file: string;
    beforeAll(async () => {
      directory = await mkdtemp(join(tmpdir(), 'ava-excel-selection-'));
      file = join(directory, 'selection.xlsx');
      const zip = new AdmZip(join(__dirname, 'datasets/sales.xlsx'));
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

    const engine = () =>
      kind === 'duckdb'
        ? new DuckDBEngine({ model: 'unused' })
        : new PythonEngine({ model: 'unused' }, { execute: (code) => createPythonExecutor(30000)(code, 1024 * 1024) });

    it.each([undefined, true, false])('respects range, blank rows, and header=%s', async (header) => {
      const instance = engine();
      try {
        const options: ExcelSourceOptions = { path: file, sheets: [{ name: 'Sales', range: 'b3:c6', header }] };
        const schema = await instance.load({ type: 'excel', options });
        expect(schema.tables.map((table) => table.name)).toEqual(['Sales']);
        if (header !== false) expect(schema.tables[0].fields.map((field) => field.name)).toEqual(['101', '202']);
        const result = await instance.execute(
          kind === 'duckdb' ? 'SELECT * FROM "Sales"' : "assert list(tables) == ['Sales']\nresult = df"
        );
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

    it('loads all sheets with default headers when sheets is omitted', async () => {
      const instance = engine();
      try {
        const schema = await instance.load({
          type: 'excel',
          options: {
            path: join(__dirname, 'datasets/sales.xlsx'),
          },
        });
        expect(schema.tables.map((table) => table.name).sort()).toEqual(['Costs', 'Sales']);
        const result = await instance.execute(
          kind === 'duckdb' ? 'SELECT * FROM "Costs" LIMIT 1' : "result = tables['Costs'].head(1)"
        );
        expect(result.data).toEqual([{ order_id: 'ORD-0001', cost: 165 }]);
      } finally {
        await instance.dispose();
      }
    });

    it('applies independent ranges and headers to two sheets', async () => {
      const instance = engine();
      try {
        const schema = await instance.load({
          type: 'excel',
          options: {
            path: file,
            sheets: [
              { name: 'Sales', range: 'B3:C4', header: true },
              { name: 'Costs', range: 'A2:B3', header: false },
            ],
          },
        });
        expect(schema.tables.map((table) => table.name).sort()).toEqual(['Costs', 'Sales']);
        const sales = await instance.execute(kind === 'duckdb' ? 'SELECT * FROM "Sales"' : "result = tables['Sales']");
        expect(sales.data).toEqual([{ '101': 1, '202': 2 }]);
        const costs = await instance.execute(kind === 'duckdb' ? 'SELECT * FROM "Costs"' : "result = tables['Costs']");
        expect(costs.data.map((row) => Object.values(row))).toEqual([
          ['ORD-0001', 165],
          ['ORD-0002', 420],
        ]);
      } finally {
        await instance.dispose();
      }
    });

    it('handles literal entity text without selecting the other sheet', async () => {
      const named = join(directory, 'entity.xlsx');
      const zip = new AdmZip(file);
      zip.updateFile(
        'xl/workbook.xml',
        Buffer.from(
          zip
            .readAsText('xl/workbook.xml')
            .replace('name="Sales"', 'name="Sales &amp;amp; Tax"')
            .replace('name="Costs"', 'name="Sales &amp; Tax"')
        )
      );
      zip.writeZip(named);
      const instance = engine();
      try {
        const loading = instance.load({
          type: 'excel',
          options: {
            path: named,
            sheets: [{ name: 'Sales &amp; Tax', range: 'B3:C4' }],
          },
        });
        if (kind === 'duckdb') {
          await expect(loading).rejects.toThrow('cannot safely read Excel sheet');
        } else {
          expect((await loading).tables.map((table) => table.name)).toEqual(['Sales &amp; Tax']);
          expect((await instance.execute('result = df')).data).toEqual([{ '101': 1, '202': 2 }]);
        }
      } finally {
        await instance.dispose();
      }
    });

    it('rejects an unknown sheet instead of loading all sheets', async () => {
      const instance = engine();
      try {
        await expect(
          instance.load({ type: 'excel', options: { path: file, sheets: [{ name: 'Missing' }] } })
        ).rejects.toThrow();
      } finally {
        await instance.dispose();
      }
    });
  });
}
