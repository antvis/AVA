import { CHARTS } from '../ckb';
import {
  adviseChartByDataShardPrompt,
  adviseChartByInputPrompt,
  genSpecByDataShardPrompt,
  genSpecByInputPrompt,
} from '../prompt';
import { logError, requestLLM, safeJsonParse, isOpenAi, isTbox, computeAllowedChartIds, logInDev } from '../utils';
import type {
  AdvisorConfig,
  AdviseStageOutput,
  Meta,
  PlainLikeDataType,
  DataShard,
  ChartIdMatrix,
  Spec,
} from '../types';
import { isEmpty } from 'lodash';

/**
 * @desc recommend chart ids based on data shape
 */
export async function recommendChartIds(params: {
  dataShards: DataShard[];
  llm: AdvisorConfig['llm'];
  input: string;
  allowed?: string[];
}): Promise<ChartIdMatrix> {
  const { dataShards, llm, allowed, input } = params;
  if (!llm) throw new Error('LLM config is missing or invalid');
  const allowedIds = allowed ?? Object.keys(CHARTS);
  const prompt = isEmpty(dataShards)
    ? adviseChartByInputPrompt([input], allowedIds)
    : adviseChartByDataShardPrompt(
        dataShards.map(({ metas, data, purpose }) => ({
          metas: metas.map((item) => {
            const { statisticsFeature: _statisticsFeature, ...rest } = item;
            return rest;
          }),
          data: data as PlainLikeDataType,
          purpose: purpose?.purposeDesc ?? '',
        })),
        allowedIds
      );
  const recommendationStr = await requestLLM({ config: llm, prompt });
  logInDev.debug('LLM recommend chart ids', recommendationStr);
  const ids = safeJsonParse(recommendationStr, []) as ChartIdMatrix;
  if (!ids.length) {
    throw new Error('empty chart advise');
  }
  return ids;
}

/**
 * @desc generate chart specs based on selected chart ids
 */
export async function generateSpecs(params: {
  dataShards: DataShard[];
  selectedChartIds: string[];
  input: string;
  llm: AdvisorConfig['llm'];
}): Promise<Spec[]> {
  const { dataShards, selectedChartIds, input, llm } = params;
  const prompt = isEmpty(dataShards)
    ? genSpecByInputPrompt([{ input, chartId: selectedChartIds[0] }])
    : genSpecByDataShardPrompt(
        dataShards.map(({ data, metas }, i) => ({
          chartId: selectedChartIds[i],
          data: data as PlainLikeDataType,
          metas: metas.map((item) => {
            const { statisticsFeature: _statisticsFeature, ...rest } = item;
            return rest;
          }),
        }))
      );
  const chartSpecsStr = await requestLLM({ config: llm, prompt });
  logInDev.debug('LLM generate chart specs', chartSpecsStr);
  const chartSpecs = safeJsonParse(chartSpecsStr, []) as Spec[];
  if (!chartSpecs.length || chartSpecs.length !== selectedChartIds.length) {
    throw new Error('empty chart spec');
  }
  return chartSpecs.map((cfg, i) => ({ ...cfg, type: selectedChartIds[i] }));
}

/**
 * @desc advise plain charts based on data shape
 */
export async function adviseCharts(dataShards: DataShard[], config: AdvisorConfig = {}): Promise<AdviseStageOutput> {
  const allowed = computeAllowedChartIds(config.includes, config.excludes);
  const { llm, input } = config;
  const useLLM = !!llm && (isOpenAi(llm) || isTbox(llm));
  if (!useLLM) {
    logError('LLM config is missing or invalid');
    return [];
  }

  let selectedChartIds: string[] = [];
  try {
    const idsMatrix = await recommendChartIds({
      dataShards,
      llm,
      input,
      allowed,
    });
    // select the highest scored chart id for each shard
    selectedChartIds = idsMatrix.map((row) => row[0]);
  } catch (e) {
    logError('LLM advise failed', e);
    return [];
  }

  let specs: Spec[] = [];
  try {
    specs = await generateSpecs({
      dataShards,
      selectedChartIds,
      input,
      llm,
    });
  } catch (e) {
    logError('LLM spec generation failed', e);
    return [];
  }

  const output: AdviseStageOutput = specs.map((spec, i) => ({
    metas: dataShards[i]?.metas as Meta[],
    data: dataShards[i]?.data as PlainLikeDataType,
    charts: [
      {
        spec,
      },
    ],
  }));

  return output;
}
