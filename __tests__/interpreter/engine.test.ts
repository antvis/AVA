/**
 * Unit tests for src/interpreter/engine.ts
 */

import { describe, it, expect, afterEach } from 'vitest';

import { InterpreterEngine } from '../../src/interpreter/engine';
import { getLLMConfig, skipLLMTests } from '../test-utils';

describe('interpreter/engine', () => {
  let engine: InterpreterEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('loads a json source and returns its schema', async () => {
    engine = new InterpreterEngine(getLLMConfig());
    const schema = await engine.load({ type: 'json', options: { data: [{ name: 'Alice', age: 30 }] } });

    expect(schema.tables).toHaveLength(1);
    expect(schema.tables[0].name).toBe('data');
    expect(schema.tables[0]).toEqual({
      name: 'data',
      rowCount: 1,
      columnCount: 2,
      fields: [
        { name: 'name', type: 'string' },
        { name: 'age', type: 'number' },
      ],
      indexes: [],
    });
  });

  it('rejects unsupported source types', async () => {
    engine = new InterpreterEngine(getLLMConfig());
    await expect(engine.load({ type: 'mysql', options: {} } as any)).rejects.toThrow(
      'InterpreterEngine only supports csv/json/text sources'
    );
  });

  it('executes JavaScript code against the loaded data', async () => {
    engine = new InterpreterEngine(getLLMConfig());
    await engine.load({ type: 'json', options: { data: [{ value: 10 }, { value: 20 }] } });

    const result = await engine.execute('const result = stat.sum(data, "value");');
    expect(result.data).toEqual([{ value: 30 }]);
  });

  it('returns a bounded result', async () => {
    engine = new InterpreterEngine(getLLMConfig());
    await engine.load({ type: 'json', options: { data: [{ value: 10 }, { value: 20 }] } });

    const result = await engine.execute('const result = data;', { maxRows: 1 });
    expect(result.data).toEqual([{ value: 10 }]);
    expect(result.truncated).toBe(true);
  });

  it('throws when executing without loading data', async () => {
    engine = new InterpreterEngine(getLLMConfig());
    await expect(engine.execute('const result = 1;')).rejects.toThrow('No data loaded');
  });

  it.skipIf(skipLLMTests)('generates JavaScript code from a natural-language query', async () => {
    engine = new InterpreterEngine(getLLMConfig());
    await engine.load({ type: 'json', options: { data: [{ value: 10 }, { value: 20 }] } });

    const code = await engine.getDSL('sum of value');
    const result = await engine.execute(code);
    expect(result.data).toEqual([{ value: 30 }]);
  });
});
