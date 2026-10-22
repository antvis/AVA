import { generateText } from 'ai';
import { describe, expect, it, vi } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../../../src/util/model', () => ({ languageModel: vi.fn() }));

describe('loaders/text JSON ingestion', () => {
  it('uses the native JSON reader after extraction', async () => {
    vi.mocked(generateText).mockResolvedValueOnce({ text: '[{"city":"Beijing","value":100}]' } as any);
    const engine = new DuckDBEngine({ model: 'mock' });
    try {
      await engine.load({ type: 'text', options: { text: 'Beijing 100' } });
      expect((await engine.execute('SELECT * FROM data')).data).toEqual([{ city: 'Beijing', value: 100 }]);
    } finally {
      await engine.dispose();
    }
  });

  it('rejects extracted arrays that contain non-record values', async () => {
    vi.mocked(generateText).mockResolvedValueOnce({ text: '[1,2]' } as any);
    const engine = new DuckDBEngine({ model: 'mock' });
    try {
      await expect(engine.load({ type: 'text', options: { text: '1 2' } })).rejects.toThrow('plain objects');
    } finally {
      await engine.dispose();
    }
  });
});
