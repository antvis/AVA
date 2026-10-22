/**
 * JSON 文件 load/schema 测试，使用 __tests__/datasets/customers.json。
 * 无需数据库或 LLM，默认执行；只对比完整 schema，不查询业务数据。
 * 运行：npx vitest run __tests__/duckdb/loaders/json-file.test.ts
 */
import * as path from 'path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import { describe, it, expect, afterEach } from 'vitest';

import { writeTempFile, removeTempFile } from '../../../src/duckdb/util/file';
import { sourceConfig } from '../../../src/cli/session/protocol';
import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

describe('loaders/json-file', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('returns an empty table for unmatched files only when allow_empty is enabled', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'ava-empty-json-'));
    try {
      engine = new DuckDBEngine(getLLMConfig());
      const options = { path: path.join(directory, '*.json') };
      await expect(engine.load({ type: 'json-file', options })).rejects.toThrow();
      await engine.load({ type: 'json-file', options: { ...options, options: { allow_empty: true } } });
      expect((await engine.schema()).models[0].columns).toEqual([{ name: 'empty', type: 'BOOLEAN', notNull: false }]);
      expect((await engine.execute('SELECT * FROM data')).data).toEqual([]);
    } finally {
      await engine?.dispose();
      engine = null;
      await rm(directory, { recursive: true, force: true });
    }
  });

  it.each([true, false])('accepts the array=%s shorthand through CLI configuration', async (array) => {
    const file = await writeTempFile(array ? '[{"id":1},{"id":2}]' : '{"id":1}\n{"id":2}\n', 'json');
    try {
      engine = new DuckDBEngine(getLLMConfig());
      await engine.load(sourceConfig.parse({ type: 'json-file', options: { path: file, options: { array } } }));
      expect((await engine.execute('SELECT * FROM data ORDER BY id')).data).toEqual([{ id: 1 }, { id: 2 }]);
    } finally {
      await removeTempFile(file);
    }
  });

  it.each([true, false])('opts into integer strings and GeoJSON inference with %s', async (enabled) => {
    const file = await writeTempFile(
      '[{"id":"42","geometry":{"type":"Point","coordinates":[1,2]},"time":"2024-01-01T12:00:00+05:00"}]',
      'json'
    );
    try {
      engine = new DuckDBEngine(getLLMConfig());
      await engine.load({
        type: 'json-file',
        options: { path: file, options: { convert_strings_to_integers: enabled, geojson: enabled } },
      });
      expect((await engine.schema()).models[0].columns).toEqual([
        { name: 'id', type: enabled ? 'BIGINT' : 'VARCHAR', notNull: false },
        {
          name: 'geometry',
          type: enabled ? 'GEOMETRY' : 'STRUCT("type" VARCHAR, coordinates BIGINT[])',
          notNull: false,
        },
        { name: 'time', type: 'TIMESTAMP WITH TIME ZONE', notNull: false },
      ]);
      expect((await engine.execute('SELECT id FROM data')).data).toEqual([{ id: enabled ? 42 : '42' }]);
    } finally {
      await removeTempFile(file);
    }
  });

  it('passes CLI JSON options through to the NDJSON reader', async () => {
    const file = await writeTempFile('{"id":1}\ninvalid\n{"id":2}\n', 'json');
    try {
      engine = new DuckDBEngine(getLLMConfig());
      await engine.load(
        sourceConfig.parse({
          type: 'json-file',
          options: {
            path: file,
            options: { format: 'newline_delimited', ignore_errors: true, columns: { id: 'VARCHAR' } },
          },
        })
      );
      const result = await engine.execute('SELECT id FROM data WHERE id IS NOT NULL ORDER BY id');
      expect(result.data).toEqual([{ id: '1' }, { id: '2' }]);
    } finally {
      await engine?.dispose();
      engine = null;
      await removeTempFile(file);
    }
  });

  it('loads a JSON file with a complete schema and original column order', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({ type: 'json-file', options: { path: path.join(__dirname, '../../datasets/customers.json') } });
    const schema = await engine.schema();

    expect(schema).toEqual({
      models: [
        {
          name: 'data',
          columns: [
            { name: 'customer_id', type: 'BIGINT', notNull: false },
            { name: 'name', type: 'VARCHAR', notNull: false },
            { name: 'active', type: 'BOOLEAN', notNull: false },
            { name: 'balance', type: 'DOUBLE', notNull: false },
            { name: 'created_on', type: 'DATE', notNull: false },
            { name: 'tags', type: 'VARCHAR[]', notNull: false },
            { name: 'profile', type: 'STRUCT(city VARCHAR, score BIGINT)', notNull: false },
            { name: 'note', type: 'VARCHAR', notNull: false },
          ],
          tableReference: { catalog: 'memory', schema: 'main', table: 'data' },
        },
      ],
      relationships: [],
      views: [],
    });
  });

  it('loads heterogeneous NDJSON as native JSON and preserves quoted names', async () => {
    const file = await writeTempFile(
      '{"pay\\"load":[1.5,"2",null],"original":{"ok":true}}\n{"pay\\"load":"text","original":null}\n',
      'json'
    );
    try {
      engine = new DuckDBEngine(getLLMConfig());
      await engine.load({
        type: 'json-file',
        options: {
          path: file,
          options: {
            auto_detect: false,
            format: 'newline_delimited',
            columns: { 'pay"load': 'JSON', original: 'JSON' },
          },
        },
      });
      const result = await engine.execute('SELECT "pay""load"::VARIANT AS "pay""load", original FROM data');
      expect(result.schema).toEqual([
        { name: 'pay"load', type: 'VARIANT' },
        { name: 'original', type: 'VARCHAR' },
      ]);
      expect((await engine.schema()).models[0].columns).toMatchObject([
        { name: 'pay"load', type: 'JSON' },
        { name: 'original', type: 'JSON' },
      ]);
      expect(result.data).toEqual([
        { 'pay"load': [1.5, '2', null], original: '{"ok":true}' },
        { 'pay"load': 'text', original: null },
      ]);
    } finally {
      await removeTempFile(file);
    }
  });

  it('infers nested types once and keeps repeated queries independent of the source file', async () => {
    const file = await writeTempFile(
      JSON.stringify([
        { id: 1, profile: { city: 'Hangzhou', score: 10 }, tags: ['a', 'b'] },
        { id: 2, profile: { score: 20 } },
      ]),
      'json'
    );
    try {
      engine = new DuckDBEngine(getLLMConfig());
      await engine.load({ type: 'json-file', options: { path: file } });
      await removeTempFile(file);
      const schema = await engine.schema();
      expect(schema.models[0].columns).toMatchObject([
        { name: 'id', type: 'BIGINT' },
        { name: 'profile', type: 'STRUCT(city VARCHAR, score BIGINT)' },
        { name: 'tags', type: 'VARCHAR[]' },
      ]);
      expect(schema.views).toEqual([]);
      for (let i = 0; i < 2; i += 1) {
        expect((await engine.execute('SELECT SUM(profile.score) AS total FROM data')).data).toEqual([{ total: 30 }]);
      }
      expect((await engine.execute('SELECT id, profile.city AS city FROM data ORDER BY id')).data).toEqual([
        { id: 1, city: 'Hangzhou' },
        { id: 2, city: null },
      ]);
      const profile = await engine.profile(schema, { metrics: ['row_count', 'null_count'] });
      expect(profile.models[0].metrics.row_count).toBe(2);
    } finally {
      await removeTempFile(file);
    }
  });
});
