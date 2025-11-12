import { generateSpecs, recommendChartIds, advisePlainCharts } from '../../../src/advise/plain';
import * as utils from '../../../src/utils';
import { COMPARISON_DATA, MULTI_DATA_SHARDS, OPENAI_LLM, SINGLE_DATA_SHARD, TREND_DATA } from '../constant';

jest.mock('../../../src/utils', () => {
  const actual = jest.requireActual('../../../src/utils');
  return { ...actual, requestLLM: jest.fn() };
});

describe('Plain Chart Advise', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('recommendChartIds: returns chart ids for single shard', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValue('[ ["line", "bar"] ]');
    const ids = await recommendChartIds(SINGLE_DATA_SHARD, OPENAI_LLM);
    expect(ids).toEqual([['line', 'bar']]);
  });

  it('recommendChartIds: returns chart ids for multiple shards', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValue('[ ["line"], ["pie"] ]');
    const ids = await recommendChartIds(MULTI_DATA_SHARDS, OPENAI_LLM);
    expect(ids).toEqual([['line'], ['pie']]);
  });

  it('recommendChartIds: throws when LLM returns empty for single shard', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValue('[]');
    await expect(recommendChartIds(SINGLE_DATA_SHARD, OPENAI_LLM)).rejects.toThrow('empty chart advise');
  });

  it('recommendChartIds: throws when ids count less than shard count', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValue('[ ["line"] ]');
    await expect(recommendChartIds(MULTI_DATA_SHARDS, OPENAI_LLM)).rejects.toThrow('empty chart advise');
  });

  it('generateSpecs: returns specs for single shard', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValue(JSON.stringify([TREND_DATA.spec]));
    const specs = await generateSpecs(SINGLE_DATA_SHARD, ['line'], OPENAI_LLM);
    expect(specs).toEqual([{ ...TREND_DATA.spec, type: 'line' }]);
  });

  it('generateSpecs: returns specs for multiple shards', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValue(JSON.stringify([TREND_DATA.spec, COMPARISON_DATA.spec]));
    const specs = await generateSpecs(MULTI_DATA_SHARDS, ['line', 'pie'], OPENAI_LLM);
    expect(specs).toEqual([
      { ...TREND_DATA.spec, type: 'line' },
      { ...COMPARISON_DATA.spec, type: 'pie' },
    ]);
  });

  it('generateSpecs: throws when LLM returns empty for single shard', async () => {
    const requestLLM = utils.requestLLM as unknown as jest.Mock;
    requestLLM.mockResolvedValue('[]');
    await expect(generateSpecs(SINGLE_DATA_SHARD, ['line'], OPENAI_LLM)).rejects.toThrow('empty chart spec');
  });

  it('generateSpecs: throws when LLM returns empty for multiple shards', async () => {
    const requestLLM = utils.requestLLM as unknown as jest.Mock;
    requestLLM.mockResolvedValue('[]');
    await expect(generateSpecs(MULTI_DATA_SHARDS, ['line', 'pie'], OPENAI_LLM)).rejects.toThrow('empty chart spec');
  });

  it('advisePlainCharts: returns empty output when LLM is missing', async () => {
    const out = await advisePlainCharts(SINGLE_DATA_SHARD, { llm: OPENAI_LLM });
    expect(out).toEqual([]);
  });

  it('advisePlainCharts: returns advise output for single shard', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValueOnce('[ ["line", "bar"] ]').mockResolvedValueOnce(JSON.stringify([TREND_DATA.spec]));

    const out = await advisePlainCharts(SINGLE_DATA_SHARD, { llm: OPENAI_LLM });
    expect(out).toEqual([
      {
        metas: SINGLE_DATA_SHARD[0].metas,
        data: SINGLE_DATA_SHARD[0].data,
        charts: [
          {
            spec: { ...TREND_DATA.spec, type: 'line' },
          },
        ],
      },
    ]);
  });

  it('advisePlainCharts: returns advise output for multiple shards', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM
      .mockResolvedValueOnce('[ ["line"], ["pie"] ]')
      .mockResolvedValueOnce(JSON.stringify([TREND_DATA.spec, COMPARISON_DATA.spec]));

    const out = await advisePlainCharts(MULTI_DATA_SHARDS, { llm: OPENAI_LLM });
    expect(out).toEqual([
      {
        metas: MULTI_DATA_SHARDS[0].metas,
        data: MULTI_DATA_SHARDS[0].data,
        charts: [
          {
            spec: { ...TREND_DATA.spec, type: 'line' },
          },
        ],
      },
      {
        metas: MULTI_DATA_SHARDS[1].metas,
        data: MULTI_DATA_SHARDS[1].data,
        charts: [
          {
            spec: { ...COMPARISON_DATA.spec, type: 'pie' },
          },
        ],
      },
    ]);
  });

  it('advisePlainCharts: returns empty output when recommendation is empty', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValueOnce('[]');
    const out = await advisePlainCharts(SINGLE_DATA_SHARD, { llm: OPENAI_LLM });
    expect(out).toEqual([]);
  });

  it('advisePlainCharts: returns empty output when spec generation is empty', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValueOnce('[ ["line"] ]').mockResolvedValueOnce('[]');
    const out = await advisePlainCharts(SINGLE_DATA_SHARD, { llm: OPENAI_LLM });
    expect(out).toEqual([]);
  });
});
