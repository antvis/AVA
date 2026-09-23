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
    const schema = await engine.load({
      type: 'parquet',
      options: { path: path.join(__dirname, '../../datasets/041_Airline.parquet') },
    });

    expect(schema).toEqual({
      tables: [
        {
          name: 'data',
          columnCount: 15,
          fields: [
            { name: 'tweet_id', type: 'BIGINT', nullable: true },
            { name: 'airline_sentiment', type: 'VARCHAR', nullable: true },
            { name: 'airline_sentiment_confidence', type: 'DOUBLE', nullable: true },
            { name: 'negativereason', type: 'VARCHAR', nullable: true },
            { name: 'negativereason_confidence', type: 'DOUBLE', nullable: true },
            { name: 'airline', type: 'VARCHAR', nullable: true },
            { name: 'airline_sentiment_gold', type: 'VARCHAR', nullable: true },
            { name: 'name', type: 'VARCHAR', nullable: true },
            { name: 'negativereason_gold', type: 'VARCHAR', nullable: true },
            { name: 'retweet_count', type: 'UTINYINT', nullable: true },
            { name: 'text', type: 'VARCHAR', nullable: true },
            { name: 'tweet_coord', type: 'DOUBLE[]', nullable: true },
            { name: 'tweet_created', type: 'TIMESTAMP WITH TIME ZONE', nullable: true },
            { name: 'tweet_location', type: 'VARCHAR', nullable: true },
            { name: 'user_timezone', type: 'VARCHAR', nullable: true },
          ],
          indexes: [],
        },
      ],
      relations: [],
    });
  });
});
