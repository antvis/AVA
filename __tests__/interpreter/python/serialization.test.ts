import { describe, expect, it } from 'vitest';

import { executionCode } from '../../../src/interpreter/python/util/code';
import { createPythonExecutor } from '../../../src/interpreter/python/util/execute';

import { executeDocker } from './sandbox/execute';

import type { ExecutionOptions } from '../../../src/types';

const executeLocal = createPythonExecutor(30_000);
const executors = [
  {
    name: 'local',
    enabled: process.env.AVA_PYTHON_LOCAL_TEST === '1',
    execute: (code: string) => executeLocal(code, 2 * 1024 * 1024),
  },
  {
    name: 'Docker',
    enabled: process.env.AVA_PYTHON_DOCKER_TEST === '1',
    execute: executeDocker,
  },
];

describe.each(executors)('python result serialization ($name)', ({ enabled, execute }) => {
  const run = (code: string, limits: ExecutionOptions = { maxRows: 10, maxResultBytes: 1024 }) =>
    execute(executionCode(code, { type: 'json', options: { data: [] } }, limits));

  it.skipIf(!enabled)(
    'preserves fractional precision, nulls and ISO dates',
    async () => {
      const result = await run(`result = {
    'fraction': 1 / 3,
    'small': -0.000123456789012,
    'missing': None,
    'nan': float('nan'),
    'date': pd.Timestamp('2026-01-01T12:34:56.789'),
    'missing_date': pd.NaT,
}`);
      expect(result.data[0].fraction).toBeCloseTo(1 / 3, 15);
      expect(result.data[0]).toMatchObject({
        small: -0.000123456789012,
        missing: null,
        nan: null,
        date: '2026-01-01T12:34:56.789',
        missing_date: null,
      });
      expect(result.rowCount).toBe(1);
      expect(result.truncated).toBeUndefined();
    },
    30000
  );

  it.skipIf(!enabled)(
    'applies row and byte limits to the preserved numeric output',
    async () => {
      const code = "result = pd.DataFrame({'value': [0.123456789012345, 0.987654321098765]})";
      const first = { value: 0.123456789012345 };
      expect(await run(code, { maxRows: 1, maxResultBytes: 1024 })).toMatchObject({
        data: [first],
        truncated: true,
        truncatedBy: 'maxRows',
      });

      const limited = await run(code, { maxRows: 10, maxResultBytes: Buffer.byteLength(JSON.stringify(first)) });
      expect(limited).toMatchObject({ data: [first], truncated: true, truncatedBy: 'maxResultBytes' });
      expect(limited.rowCount).toBeUndefined();
    },
    30000
  );
});
