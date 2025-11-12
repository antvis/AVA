import { CHARTS } from '../ckb';
import { getChartAdvisePrompt, getSpecGeneratePrompt } from '../prompt';
import { logError, requestLLM, safeJsonParse, isOpenAi, isTbox, computeAllowedChartIds } from '../utils';
import type {
  AdvisorConfig,
  AdviseStageOutput,
  Meta,
  PlainLikeDataType,
  DataShard,
  ChartIdMatrix,
  Spec,
} from '../types';

/**
 * @desc recommend chart ids based on data shape
 */
export async function recommendChartIds(
  dataShards: DataShard[],
  llm: AdvisorConfig['llm'],
  allowed?: string[]
): Promise<ChartIdMatrix> {
  if (!llm) throw new Error('LLM config is missing or invalid');
  const allowedIds = allowed ?? Object.keys(CHARTS);
  const advisePrompt = getChartAdvisePrompt(
    dataShards.map(({ metas, data, purpose }) => ({
      metas,
      data: data as PlainLikeDataType,
      purpose: purpose?.purposeDesc ?? '',
    })),
    allowedIds
  );
  const recommendationStr = await requestLLM({ config: llm, prompt: advisePrompt });
  const ids = safeJsonParse(recommendationStr, []) as ChartIdMatrix;
  if (!ids.length || ids.length !== dataShards.length) {
    throw new Error('empty chart advise');
  }
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
    dataShards.map(({ data, metas }, i) => ({
      chartId: selectedChartIds[i],
      data: data as PlainLikeDataType,
      metas: metas as Meta[],
    }))
  );
  const chartSpecsStr = await requestLLM({ config: llm, prompt: specPrompt });
  const chartSpecs = safeJsonParse(chartSpecsStr, []) as Spec[];
  if (!chartSpecs.length || chartSpecs.length !== selectedChartIds.length) {
    throw new Error('empty chart spec');
  }
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
    const idsMatrix = await recommendChartIds(dataShards, llm, allowed);
    // select the highest scored chart id for each shard
    selectedChartIds = idsMatrix.map((row) => row[0]);
  } catch (e) {
    logError('LLM advise failed', e);
    return [];
  }

  let specs: Spec[] = [];
  try {
    specs = await generateSpecs(dataShards, selectedChartIds, llm);
  } catch (e) {
    logError('LLM spec generation failed', e);
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
