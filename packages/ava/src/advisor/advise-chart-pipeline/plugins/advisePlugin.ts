import { logError, logInDev, isOpenAi, isTbox, requestLLM, safeJsonParse } from '@ava/utils';
import {
  AdviseChartParams,
  AdviseChartPluginInput,
  AdvisorPlugin,
  ChartConfig,
  AdviseChart,
  IAdviseChartPipeline,
  DataShard,
  PlainLikeDataType,
} from '@ava/types';
import {
  generateAllChartConfigs,
  optimizeChartConfig,
  sortChartConfigs,
  transformChartEncode,
} from '@ava/advisor/chartAdvise';
import { getPlainChartAdvisePrompt } from '@ava/advisor/chartAdvise/prompt';
import { AdviseChartPluginEnum } from '@ava/constants/pipeline';
import { DATA_SHAPE } from '@ava/extract/constants';

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
    let allChartConfigs: Array<ChartConfig[]> = [];
    let _llmCompleted = false;
    let _llmCostTime = '';
    const { context, dataStore } = input;
    const { excludes, includes, disableModel, forceType, llm, uiConfig = {} } = context;
    const paramList = dataShards.map((shard) => {
      const { data, metas, purpose } = shard;
      // generate all valid chart configs using field data
      const curConfigs = generateAllChartConfigs(metas, excludes, includes);
      allChartConfigs.push(curConfigs);
      return {
        userInput: purpose?.purposeDesc ?? '',
        chartConfig: curConfigs,
        metas,
        data: data as PlainLikeDataType,
      };
    });
    if (forceType && dataShards.length === 1) {
      // user specified chart type
      const finalRes: AdviseChart[] = allChartConfigs[0]
        .filter((item) => item.type === forceType)
        .map((item) => ({
          type: item.type,
          encode: transformChartEncode(item.encode),
        }));

      const result = [
        {
          adviseCharts: finalRes,
          metas: dataShards[0].metas,
          data: dataShards[0].data as PlainLikeDataType,
        },
      ];
      dataStore.advise = result;
    } else {
      if (!disableModel) {
        try {
          logInDev.debug('All possible chart configs', JSON.stringify(allChartConfigs));
          // Use LLM to score all chart configs based on user purpose/data/metas
          const prompt = getPlainChartAdvisePrompt(paramList);
          const startTime = performance.now();
          let LLMRes = '';
          if (!isOpenAi(llm) && !isTbox(llm)) {
            logError('LLM config is missing or invalid');
          } else {
            LLMRes = await requestLLM({ config: llm, prompt });
          }
          if (LLMRes) {
            logInDev.debug('chart configs after LLM scoring', LLMRes);
            const LLMResArr = safeJsonParse(LLMRes, []);
            if (LLMResArr.length === allChartConfigs.length) {
              allChartConfigs = allChartConfigs.map((configs, index) => sortChartConfigs(configs, LLMResArr[index]));
            }
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
      const finalRes = allChartConfigs.map((configs, index) => {
        const { data, metas } = dataShards[index];
        const adviseCharts = optimizeChartConfig({
          chartConfigs: configs,
          metas,
          data: data as PlainLikeDataType,
          uiConfig,
        });
        return {
          adviseCharts,
          metas,
          data: data as PlainLikeDataType,
        };
      });
      logInDev.debug('chart configs after optimization', JSON.stringify(finalRes));
      dataStore.advise = finalRes;
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
