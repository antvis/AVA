import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, it } from 'vitest';

import { PythonEngine } from '../../src/python/engine';

it.skipIf(process.env.AVA_PYTHON_LOCAL_TEST !== '1')('loads and profiles Parquet without losing types or nulls', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'ava-parquet-'));
  const path = join(directory, 'data.parquet');
  const engine = new PythonEngine({ model: 'unused' });
  try {
    execFileSync('python3', ['-c', `import pandas as pd, sys
pd.DataFrame({'value': [2.5, None], 'label': ['NA', 'B'], 'date': pd.to_datetime(['2026-01-01', None])}).to_parquet(sys.argv[1])`, path]);
    const schema = await engine.load({ type: 'parquet', options: { path } });
    expect(schema.tables[0].fields).toEqual([
      { name: 'value', type: 'float64' },
      { name: 'label', type: 'object' },
      { name: 'date', type: 'datetime64[ns]' },
    ]);
    expect((await engine.execute('result = df')).data).toEqual([
      { value: 2.5, label: 'NA', date: '2026-01-01T00:00:00.000' },
      { value: null, label: 'B', date: null },
    ]);
    expect((await engine.profile({ metrics: ['row_count'] })).tables[0].metrics.row_count).toBe(2);
  } finally {
    await engine.dispose();
    rmSync(directory, { recursive: true, force: true });
  }
}, 30000);
