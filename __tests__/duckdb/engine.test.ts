/**
 * Unit tests for DuckDBEngine
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { DuckDBEngine } from '../../src/duckdb';
import { getLLMConfig, skipLLMTests } from '../test-utils';

describe('DuckDBEngine', () => {
  let engine: DuckDBEngine;

  beforeEach(() => {
    engine = new DuckDBEngine(getLLMConfig());
  });

  afterEach(async () => {
    await engine.dispose();
  });

  it('should load data and execute queries', async () => {
    const testData = [
      { name: 'Alice', age: 30, city: 'NYC' },
      { name: 'Bob', age: 25, city: 'SF' },
      { name: 'Charlie', age: 35, city: 'NYC' },
    ];

    await engine.load({ type: 'object', options: { data: testData } });

    const all = await engine.execute('SELECT * FROM data');
    expect(all.length).toBe(3);

    const filtered = await engine.execute("SELECT * FROM data WHERE city = 'NYC'");
    expect(filtered.length).toBe(2);

    const aggregated = await engine.execute('SELECT COUNT(*) as count FROM data');
    expect(aggregated[0].count).toBe(3);
  });

  describe.skipIf(skipLLMTests)('getDSL', () => {
    it('should generate SQL from a natural language query', async () => {
      await engine.load({
        type: 'object',
        options: { data: [{ company: 'A', region: 'East', revenue: 100 }] },
      });

      const sql = await engine.getDSL('Show all companies');

      expect(typeof sql).toBe('string');
      expect(sql.toLowerCase()).toContain('select');
      expect(sql.toLowerCase()).toContain('from');
    }, 30000);
  });
});
