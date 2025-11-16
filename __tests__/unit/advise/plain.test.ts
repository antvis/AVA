import { generateSpecs, recommendChartIds, adviseCharts } from '../../../src/advise/plain';
import * as utils from '../../../src/utils';
import { COMPARISON_DATA, MULTI_DATA_SHARDS, OPENAI_LLM, SINGLE_DATA_SHARD, TREND_DATA } from '../constant';

jest.mock('../../../src/utils', () => {
  const actual = jest.requireActual('../../../src/utils');
  return { ...actual, requestLLM: jest.fn() };
});

describe('Plain Chart Advise', () => {
  let errorSpy: jest.SpyInstance;

  beforeAll(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    errorSpy.mockRestore();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('recommendChartIds: returns chart ids for single shard', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValue('[ ["line", "bar"] ]');
    const ids = await recommendChartIds({ dataShards: SINGLE_DATA_SHARD, llm: OPENAI_LLM, input: '用柱状图展示' });
    expect(ids).toEqual([['line', 'bar']]);
  });

  it('recommendChartIds: returns chart ids for multiple shards', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValue('[ ["line"], ["pie"] ]');
    const ids = await recommendChartIds({ dataShards: MULTI_DATA_SHARDS, llm: OPENAI_LLM, input: '用柱状图展示' });
    expect(ids).toEqual([['line'], ['pie']]);
  });

  it('recommendChartIds: throws when LLM returns empty for single shard', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValue('[]');
    await expect(
      recommendChartIds({ dataShards: SINGLE_DATA_SHARD, llm: OPENAI_LLM, input: '用柱状图展示' })
    ).rejects.toThrow('empty chart advise');
  });

  it('recommendChartIds: throws when ids count less than shard count', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValue('[]');
    await expect(
      recommendChartIds({ dataShards: MULTI_DATA_SHARDS, llm: OPENAI_LLM, input: '用柱状图展示' })
    ).rejects.toThrow('empty chart advise');
  });

  it('generateSpecs: returns specs for single shard', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValue(JSON.stringify([TREND_DATA.spec]));
    const specs = await generateSpecs({
      dataShards: SINGLE_DATA_SHARD,
      selectedChartIds: ['line'],
      llm: OPENAI_LLM,
      input: '',
    });
    expect(specs).toEqual([{ ...TREND_DATA.spec, type: 'line' }]);
  });

  it('generateSpecs: returns specs for multiple shards', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValue(JSON.stringify([TREND_DATA.spec, COMPARISON_DATA.spec]));
    const specs = await generateSpecs({
      dataShards: MULTI_DATA_SHARDS,
      selectedChartIds: ['line', 'pie'],
      llm: OPENAI_LLM,
      input: '',
    });
    expect(specs).toEqual([
      { ...TREND_DATA.spec, type: 'line' },
      { ...COMPARISON_DATA.spec, type: 'pie' },
    ]);
  });

  it('generateSpecs: throws when LLM returns empty for single shard', async () => {
    const requestLLM = utils.requestLLM as unknown as jest.Mock;
    requestLLM.mockResolvedValue('[]');
    await expect(
      generateSpecs({
        dataShards: SINGLE_DATA_SHARD,
        selectedChartIds: ['line'],
        llm: OPENAI_LLM,
        input: '',
      })
    ).rejects.toThrow('empty chart spec');
  });

  it('generateSpecs: throws when LLM returns empty for multiple shards', async () => {
    const requestLLM = utils.requestLLM as unknown as jest.Mock;
    requestLLM.mockResolvedValue('[]');
    await expect(
      generateSpecs({
        dataShards: MULTI_DATA_SHARDS,
        selectedChartIds: ['line', 'pie'],
        llm: OPENAI_LLM,
        input: '',
      })
    ).rejects.toThrow('empty chart spec');
  });

  it('adviseCharts: returns empty output when LLM is missing', async () => {
    const out = await adviseCharts(SINGLE_DATA_SHARD, {});
    expect(out).toEqual([]);
  });

  it('adviseCharts: returns advise output for single shard', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValueOnce('[ ["line", "bar"] ]').mockResolvedValueOnce(JSON.stringify([TREND_DATA.spec]));

    const out = await adviseCharts(SINGLE_DATA_SHARD, { llm: OPENAI_LLM });
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

  it('adviseCharts: returns advise output for multiple shards', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM
      .mockResolvedValueOnce('[ ["line"], ["pie"] ]')
      .mockResolvedValueOnce(JSON.stringify([TREND_DATA.spec, COMPARISON_DATA.spec]));

    const out = await adviseCharts(MULTI_DATA_SHARDS, { llm: OPENAI_LLM });
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

  it('adviseCharts: returns empty output when recommendation is empty', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValueOnce('[]');
    const out = await adviseCharts(SINGLE_DATA_SHARD, { llm: OPENAI_LLM });
    expect(out).toEqual([]);
  });

  it('adviseCharts: returns empty output when spec generation is empty', async () => {
    const requestLLM = utils.requestLLM as jest.Mock;
    requestLLM.mockResolvedValueOnce('[ ["line"] ]').mockResolvedValueOnce('[]');
    const out = await adviseCharts(SINGLE_DATA_SHARD, { llm: OPENAI_LLM });
    expect(out).toEqual([]);
  });
});
