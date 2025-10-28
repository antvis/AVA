import { logError, logInDev, isOpenAi, isTbox, requestLLM } from '@ava/utils';
import {
  AdviseChartParams,
  AdviseChartPluginInput,
  AdvisorPlugin,
  ChartConfig,
  AdviseChart,
  IAdviseChartPipeline,
  FieldDataType,
} from '@ava/types';
import {
  generateAllChartConfigs,
  optimizeChartConfig,
  sortChartConfigs,
  transformChartEncode,
} from '@ava/advisor/chartAdvise';
import { getPlainChartAdvisePrompt } from '@ava/advisor/chartAdvise/prompt';
import { AdviseChartPluginEnum } from '@ava/constants/pipeline';
import { DATA_SHAPE } from '@ava/data';

export class AdvisePlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.AdvisePlugin;

  apply = (pipeline: IAdviseChartPipeline) => {
    pipeline.stages.advise.tapPromise(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    const { dataStore } = input;
    const { dataShards } = dataStore.data;
    // create all valid chart configs using field data
    const shard = dataShards[0];
    if (shard.shape === DATA_SHAPE.PLAIN) {
      await this.advisePlain(dataShards, input);
    } else if (shard.shape === DATA_SHAPE.TREE) {
      await this.adviseTree(dataShards, input);
    } else if (shard.shape === DATA_SHAPE.GRAPH) {
      await this.adviseGraph(dataShards, input);
    }
  };

  advisePlain = async (dataShards, input: AdviseChartPluginInput) => {
    let allChartConfigs: ChartConfig[] = [];
    let _llmCompleted = false;
    let _llmCostTime = '';
    const shard = dataShards[0];
    const { context, dataStore } = input;
    const { excludes, includes, disableModel, forceType, llm } = context;
    // create all valid chart configs using field data
    allChartConfigs = generateAllChartConfigs(shard.metas, excludes, includes);
    logInDev.debug('All possible chart configs', JSON.stringify(allChartConfigs));
    const { metas } = shard;
    const data = shard.data as FieldDataType<DATA_SHAPE.PLAIN>;
    logInDev.debug('selected shard:', shard);
    if (!forceType) {
      if (!disableModel) {
        try {
          const params = {
            userInput: shard.purpose?.purposeDesc ?? '',
            chartConfig: allChartConfigs,
            metas,
            data,
          };
          // Use LLM to score all chart configs based on user purpose/data/metas
          const prompt = getPlainChartAdvisePrompt(params);
          const startTime = performance.now();
          let LLMRes = '';
          if (!isOpenAi(llm) && !isTbox(llm)) {
            logError('LLM config is missing or invalid');
          } else {
            LLMRes = await requestLLM({ config: llm, prompt });
          }
          if (LLMRes) {
            logInDev.debug('chart configs after LLM scoring', LLMRes);
            allChartConfigs = sortChartConfigs(allChartConfigs, LLMRes);
            const endTime = performance.now();
            _llmCostTime = ((endTime - startTime) / 1000).toFixed(2);
            _llmCompleted = true;
          } else {
            logError('LLM scoring failed');
          }
        } catch (error) {
          logError('LLM scoring failed', error);
        }
      }
      // Optimize chart configuration based on rules
      const finalRes = optimizeChartConfig({
        chartConfigs: allChartConfigs,
        metas,
        data,
      });
      logInDev.debug('chart configs after optimization', JSON.stringify(finalRes));
      const result = {
        adviseCharts: finalRes,
        metas,
        data,
      };

      dataStore.advise = result;
    } else {
      // user specified chart type
      const finalRes: AdviseChart[] = allChartConfigs
        .filter((item) => item.type === forceType)
        .map((item) => ({
          type: item.type,
          encode: transformChartEncode(item.encode),
        }));

      const result = {
        adviseCharts: finalRes,
        metas,
        data,
      };
      dataStore.advise = result;
    }
  };

  adviseTree = (dataShards, input: AdviseChartPluginInput) => {
    input.dataStore.advise = {
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
