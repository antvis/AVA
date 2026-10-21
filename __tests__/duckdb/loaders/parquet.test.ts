/**
 * Parquet load/schema 测试，复用 __tests__/datasets/041_Airline.parquet。
 * 无需数据库或 LLM，默认执行；只对比完整 schema，包含数组和带时区时间戳。
 * 运行：npx vitest run __tests__/duckdb/loaders/parquet.test.ts
 */
import * as path from 'path';

import { describe, it, expect, afterEach } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { getLLMConfig } from '../../test-utils';

describe('loaders/parquet', () => {
  let engine: DuckDBEngine | null = null;

  afterEach(async () => {
    await engine?.dispose();
    engine = null;
  });

  it('loads a Parquet file with a complete schema and original column order', async () => {
    engine = new DuckDBEngine(getLLMConfig());
    await engine.load({
      type: 'parquet',
      options: { path: path.join(__dirname, '../../datasets/041_Airline.parquet') },
    });
    const schema = await engine.schema();

    expect(schema).toEqual({
      models: [
        {
          name: 'data',
          columns: [
            { name: 'tweet_id', type: 'BIGINT', notNull: false },
            { name: 'airline_sentiment', type: 'VARCHAR', notNull: false },
            { name: 'airline_sentiment_confidence', type: 'DOUBLE', notNull: false },
            { name: 'negativereason', type: 'VARCHAR', notNull: false },
            { name: 'negativereason_confidence', type: 'DOUBLE', notNull: false },
            { name: 'airline', type: 'VARCHAR', notNull: false },
            { name: 'airline_sentiment_gold', type: 'VARCHAR', notNull: false },
            { name: 'name', type: 'VARCHAR', notNull: false },
            { name: 'negativereason_gold', type: 'VARCHAR', notNull: false },
            { name: 'retweet_count', type: 'UTINYINT', notNull: false },
            { name: 'text', type: 'VARCHAR', notNull: false },
            { name: 'tweet_coord', type: 'DOUBLE[]', notNull: false },
            { name: 'tweet_created', type: 'TIMESTAMP WITH TIME ZONE', notNull: false },
            { name: 'tweet_location', type: 'VARCHAR', notNull: false },
            { name: 'user_timezone', type: 'VARCHAR', notNull: false },
          ],
          tableReference: { catalog: 'memory', schema: 'main', table: 'data' },
        },
      ],
      relationships: [],
      views: schema.models.map(({ name }) => ({ name, statement: expect.any(String) })),
    });
  });
});
