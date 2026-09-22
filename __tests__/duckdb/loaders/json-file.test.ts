/**
 * JSON 文件 load/schema 测试，使用 __tests__/datasets/customers.json。
 * 无需数据库或 LLM，默认执行；只对比完整 schema，不查询业务数据。
 * 运行：npx vitest run __tests__/duckdb/loaders/json-file.test.ts
 */
import * as path from 'path';

import { describe, it, expect, afterEach } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

describe('loaders/json-file', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('loads a JSON file with a complete schema and original column order', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    const schema = await engine.load({
      type: 'json-file',
      options: { path: path.join(__dirname, '../../datasets/customers.json') },
    });

    expect(schema).toEqual({
      tables: [
        {
          name: 'data',
          columnCount: 8,
          fields: [
            { name: 'customer_id', type: 'BIGINT', nullable: true },
            { name: 'name', type: 'VARCHAR', nullable: true },
            { name: 'active', type: 'BOOLEAN', nullable: true },
            { name: 'balance', type: 'DOUBLE', nullable: true },
            { name: 'created_on', type: 'DATE', nullable: true },
            { name: 'tags', type: 'VARCHAR[]', nullable: true },
            { name: 'profile', type: 'STRUCT(city VARCHAR, score BIGINT)', nullable: true },
            { name: 'note', type: 'VARCHAR', nullable: true },
          ],
          indexes: [],
        },
      ],
      relations: [],
    });
  });
});
