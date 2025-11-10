import { adviseGraph } from '../../../src/advise';
import { OPENAI_LLM, SINGLE_DATA_SHARD, MULTI_DATA_SHARDS } from '../constant';

describe('Graph Advise', () => {
  it('adviseGraph: returns output with empty charts for single shard', async () => {
    const out = await adviseGraph(SINGLE_DATA_SHARD, { llm: OPENAI_LLM });
    expect(out).toEqual([
      {
        metas: SINGLE_DATA_SHARD[0].metas,
        data: SINGLE_DATA_SHARD[0].data,
        charts: [],
      },
    ]);
  });

  it('adviseGraph: returns output using first shard for multiple shards', async () => {
    const out = await adviseGraph(MULTI_DATA_SHARDS, {});
    expect(out).toEqual([
      {
        metas: MULTI_DATA_SHARDS[0].metas,
        data: MULTI_DATA_SHARDS[0].data,
        charts: [],
      },
    ]);
  });
});
