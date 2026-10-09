import { describe, expect, it } from 'vitest';

import { AVA } from '../../../src';
import { PythonEngine } from '../../../src/interpreter/python/engine';
import { executionCode } from '../../../src/interpreter/python/util/code';

import { executeDocker } from './sandbox/execute';

import type { DataSourceConfig } from '../../../src/types';

const source: DataSourceConfig = { type: 'json', options: { data: [{ value: 2 }, { value: 4 }, { value: null }] } };

// Explicit opt-in; missing Docker or image fails the suite once enabled.
describe.skipIf(process.env.AVA_PYTHON_DOCKER_TEST !== '1')('python Docker integration', () => {
  it('loads JSON through AVA, analyzes and profiles it, and isolates query mutations', async () => {
    const ava = new AVA({ llm: { model: 'unused' }, engine: { type: 'python', execute: executeDocker } });
    try {
      await ava.source(source);
      expect((await ava.engine!.execute("print('diagnostic')\nresult = df['value'].sum()")).data).toEqual([
        { value: 6 },
      ]);
      expect((await ava.engine!.execute("df['value'] = 99\nresult = df")).data).toEqual([
        { value: 99 },
        { value: 99 },
        { value: 99 },
      ]);
      expect((await ava.engine!.execute('result = df')).data).toEqual([{ value: 2 }, { value: 4 }, { value: null }]);
      const profile = await ava.profile({ metrics: ['row_count', 'null_count', 'min', 'max', 'mean'] });
      expect(profile.tables[0].metrics).toEqual({ row_count: 3 });
      expect(profile.tables[0].fields[0]).toMatchObject({
        name: 'value',
        logicalType: 'numeric',
        metrics: { null_count: 1, min: 2, max: 4, mean: 3 },
      });
    } finally {
      await ava.dispose();
    }
    expect(ava.engine).toBeNull();
  }, 60000);

  it.each([
    ['CSV', { type: 'csv', options: { csv: 'value;label\n2;A\n4;B', options: { delim: ';' } } }],
    ['Excel', { type: 'excel', options: { path: '/fixtures/data.xlsx' } }],
  ] as [string, DataSourceConfig][])(
    'loads %s with the expected tables and data',
    async (kind, config) => {
      const engine = new PythonEngine({ model: 'unused' }, { execute: executeDocker });
      try {
        const schema = await engine.load(config);
        expect(schema.tables.map((table) => table.name)).toEqual(kind === 'Excel' ? ['First', 'Second'] : ['data']);
        expect(schema.tables[0].fields[0].name).toBe('value');
        const result = await engine.execute(
          kind === 'Excel' ? "assert 'df' not in globals()\nresult = tables['Second']" : 'result = df'
        );
        expect(result.data).toEqual(
          kind === 'Excel'
            ? [{ value: 8 }]
            : [
                { value: 2, label: 'A' },
                { value: 4, label: 'B' },
              ]
        );
      } finally {
        await engine.dispose();
      }
    },
    40000
  );

  it('bounds generated results by rows, UTF-8 bytes and individual field size', async () => {
    const run = (code: string, maxRows: number, maxResultBytes: number) =>
      executeDocker(executionCode(code, source, { maxRows, maxResultBytes }));
    expect(await run('result = df', 3, 100)).toMatchObject({ rowCount: 3 });
    const limited = await run('result = df', 1, 100);
    expect(limited).toMatchObject({ data: [{ value: 2 }], truncated: true, truncatedBy: 'maxRows' });
    expect(limited.rowCount).toBeUndefined();
    const bytes = Buffer.byteLength(JSON.stringify({ value: '中😀' }));
    expect(await run("result = ['中😀', '中😀']", 3, bytes)).toMatchObject({
      data: [{ value: '中😀' }],
      truncatedBy: 'maxResultBytes',
    });
    await expect(run("result = 'x' * 1048576", 1, 2097152)).rejects.toThrow('1 MiB');
  }, 60000);
});
