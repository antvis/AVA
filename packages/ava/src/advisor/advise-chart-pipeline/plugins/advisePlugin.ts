import { logError, isOpenAi, isTbox, requestLLM, safeJsonParse } from '@ava/utils';
import {
  AdviseChartParams,
  AdviseChartPluginInput,
  AdvisorPlugin,
  IAdviseChartPipeline,
  DataShard,
  PlainLikeDataType,
} from '@ava/types';
import { AdviseChartPluginEnum } from '@ava/constants/pipeline';
import { DATA_SHAPE } from '@ava/extract/constants';

import { getChartAdvisePrompt, getSpecGeneratePrompt } from '../../chartAdvise/prompt';
import { CHART_ID_MAP } from '../../../ckb';
import { Spec } from '../../../bind';

export class AdvisePlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.AdvisePlugin;

  apply = (pipeline: IAdviseChartPipeline) => {
    pipeline.stages.advise.tapPromise(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    const { dataStore } = input;
    const { dataShards } = dataStore.extract;
    // create all valid chart configs using field data
    const shard = dataShards[0];
    if (shard.shape === DATA_SHAPE.PLAIN) {
      await this.advisePlain(dataShards, input);
    } else if (shard.shape === DATA_SHAPE.HIERARCHY) {
      await this.adviseTree(dataShards, input);
    } else if (shard.shape === DATA_SHAPE.RELATION) {
      await this.adviseGraph(dataShards, input);
    }
  };

  advisePlain = async (dataShards: DataShard[], input: AdviseChartPluginInput) => {
    const { context, dataStore } = input;
    const { llm } = context;
    if (!isOpenAi(llm) && !isTbox(llm)) {
      logError('LLM config is missing or invalid');
      dataStore.advise = [];
    } else {
      try {
        const params = dataShards.map((shard) => {
          const { data, metas, purpose } = shard;
          return {
            metas,
            data: data as PlainLikeDataType,
            purpose: purpose?.purposeDesc ?? '',
          };
        });
        const adviseInputs = getChartAdvisePrompt(params);
        const recommendationStr = await requestLLM({ config: llm, prompt: adviseInputs });
        const recommendation = safeJsonParse(recommendationStr, []);
        const bestCharts = recommendation.map((item) => CHART_ID_MAP[item[0]]) as string[];
        const specGenerateInputs = dataShards.map((shard, index) => {
          const { data } = shard;
          return {
            data: data as PlainLikeDataType,
            chartId: bestCharts[index],
          };
        });
        const chartSpecGeneratePrompt = getSpecGeneratePrompt(specGenerateInputs);
        const chartSpecsStr = await requestLLM({ config: llm, prompt: chartSpecGeneratePrompt });
        const chartSpecs = safeJsonParse(chartSpecsStr, []) as Spec[];
        const res = chartSpecs.map((item, index) => ({
          charts: [
            {
              spec: {
                ...item,
                type: bestCharts[index],
              },
            },
          ],
          data: dataShards[index].data as PlainLikeDataType,
          metas: dataShards[index].metas,
        }));
        dataStore.advise = res;
      } catch (error) {
        logError('LLM request failed');
        dataStore.advise = [];
      }
    }
  };

  adviseTree = (dataShards, input: AdviseChartPluginInput) => {
    input.dataStore.advise = {
      // @ts-ignore
      adviseCharts: [
        {
          type: 'tree',
          encode: {},
        },
      ],
      metas: dataShards[0].metas,
      data: dataShards[0].data,
    };
  };

  adviseGraph = (dataShards, input: AdviseChartPluginInput) => {
    input.dataStore.advise = {
      // @ts-ignore
      adviseCharts: [
        {
          type: 'graph',
          encode: {},
        },
      ],
      metas: dataShards[0].metas,
      data: dataShards[0].data,
    };
  };
}
