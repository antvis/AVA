import { CHARTS } from '../ckb';
import { getChartAdvisePrompt, getSpecGeneratePrompt } from '../prompt';
import { logError, requestLLM, safeJsonParse, isOpenAi, isTbox } from '../utils';
import type {
  AdvisorConfig,
  AdviseStageOutput,
  AdviseText,
  AdviseTextParams,
  Meta,
  PlainLikeDataType,
  DataShard,
} from '../types';
import type { Spec } from '../bind';
import { DATA_SHAPE } from '../types';

/**
 * @desc compute allowed chart ids based on includes and excludes
 */
function computeAllowedChartIds(includes?: string[], excludes?: string[]): string[] {
  const all = Object.keys(CHARTS);
  const inc = includes && includes.length ? all.filter((id) => includes.includes(id)) : all;
  const excSet = new Set(excludes || []);
  return inc.filter((id) => !excSet.has(id));
}

/**
 * @desc recommend chart ids based on data shape
 */
export async function recommendChartIds(
  dataShards: DataShard[],
  allowed: string[],
  llm: AdvisorConfig['llm']
): Promise<string[]> {
  const advisePrompt = getChartAdvisePrompt(
    dataShards.map(({ metas, data, purpose }) => ({
      metas,
      data: data as PlainLikeDataType,
      purpose: (purpose as any)?.purposeDesc ?? '',
    })),
    allowed
  );
  const recommendationStr = await requestLLM({ config: llm as any, prompt: advisePrompt });
  const recommendation = safeJsonParse(recommendationStr, []);
  const ids = (recommendation as any[]).map((item) => item[0]) as string[];
  if (!ids.length) throw new Error('empty chart advise');
  return ids;
}

/**
 * @desc generate chart specs based on selected chart ids
 */
export async function generateSpecs(
  dataShards: DataShard[],
  selectedChartIds: string[],
  llm: AdvisorConfig['llm']
): Promise<Spec[]> {
  const specPrompt = getSpecGeneratePrompt(
    dataShards.map(({ data }, i) => ({
      chartId: selectedChartIds[i],
      data: data as PlainLikeDataType,
    }))
  );
  const chartSpecsStr = await requestLLM({ config: llm as any, prompt: specPrompt });
  const chartSpecs = safeJsonParse(chartSpecsStr, []) as Spec[];
  if (!chartSpecs.length) throw new Error('empty chart spec');
  return chartSpecs.map((cfg, i) => ({ ...cfg, type: selectedChartIds[i] }));
}

/**
 * @desc advise plain charts based on data shape
 */
export async function advisePlainCharts(
  dataShards: DataShard[],
  config: AdvisorConfig = {}
): Promise<AdviseStageOutput> {
  const allowed = computeAllowedChartIds(config.includes, config.excludes);
  const { llm } = config;
  const useLLM = !!llm && (isOpenAi(llm) || isTbox(llm));
  if (!useLLM) {
    logError('LLM config is missing or invalid');
    return [];
  }

  let selectedChartIds: string[] = [];
  try {
    selectedChartIds = await recommendChartIds(dataShards, allowed, llm);
  } catch (e) {
    logError('LLM advise failed');
    return [];
  }

  let specs: Spec[] = [];
  try {
    specs = await generateSpecs(dataShards, selectedChartIds, llm);
  } catch (e) {
    logError('LLM spec generation failed');
    return [];
  }

  const output: AdviseStageOutput = dataShards.map(({ metas, data }, i) => {
    return {
      metas: metas as Meta[],
      data: data as PlainLikeDataType,
      charts: [
        {
          spec: specs[i],
        },
      ],
    };
  });

  return output;
}

/**
 * @desc advise tree based on data shape
 */
export async function adviseTree(dataShards: DataShard[], _config: AdvisorConfig = {}): Promise<AdviseStageOutput> {
  // TODO: implement tree advise
  return [
    {
      metas: dataShards[0].metas as Meta[],
      data: dataShards[0].data as PlainLikeDataType,
      charts: [],
    },
  ];
}

/**
 * @desc advise graph based on data shape
 */
export async function adviseGraph(dataShards: DataShard[], _config: AdvisorConfig = {}): Promise<AdviseStageOutput> {
  // TODO: implement graph advise
  return [
    {
      metas: dataShards[0].metas as Meta[],
      data: dataShards[0].data as PlainLikeDataType,
      charts: [],
    },
  ];
}

/**
 * @desc advise charts based on data shape
 */
export async function adviseCharts(dataShards: DataShard[], config: AdvisorConfig = {}): Promise<AdviseStageOutput> {
  const shard = dataShards[0];
  switch (shard.shape) {
    case DATA_SHAPE.PLAIN:
      return advisePlainCharts(dataShards, config);
    case DATA_SHAPE.HIERARCHY:
      return adviseTree(dataShards, config);
    case DATA_SHAPE.RELATION:
      return adviseGraph(dataShards, config);
    default:
      return [];
  }
}

/**
 * @desc advise text based on data shape
 */
export async function adviseText(_params: AdviseTextParams, _config: AdvisorConfig = {}): Promise<AdviseText> {
  // TODO: implement text advise
  return {};
}
